import type { SupabaseClient } from '@supabase/supabase-js'
import type { EntityTable, Table } from 'dexie'
import { db, type Syncable } from '@/lib/db'

// How one local Dexie table maps to one Supabase table. The engine below knows nothing
// about expenses or shopping: adding a synced table means adding one of these.
export interface SyncedTable<Local extends Syncable, Row extends ServerRow> {
  name: string // Supabase table; also names the pull cursor
  local: EntityTable<Local, 'id'>
  columns: string // columns to select, synced_at included
  onConflict?: string // upsert conflict target when the key isn't just `id`
  toRow: (local: Local) => Record<string, unknown>
  fromRow: (row: Row) => Local
}

type Client = Pick<SupabaseClient, 'from'>

// What every server row has: the pull pages by these two
interface ServerRow {
  id: string
  synced_at: string
}

// A table with its row types erased, so tables of different shapes fit in one list
export interface SyncTask {
  name: string
  run: (client: Client) => Promise<void>
}

export function toSyncTask<L extends Syncable, R extends ServerRow>(
  table: SyncedTable<L, R>,
): SyncTask {
  return {
    name: table.name,
    run: async (client) => {
      await pushTable(client, table)
      await pullTable(client, table)
    },
  }
}

const EPOCH = '1970-01-01T00:00:00Z'
const DEFAULT_PAGE_SIZE = 500

// Uploads local changes. A row edited again while uploading stays pending for the next run.
export async function pushTable<L extends Syncable, R extends ServerRow>(
  client: Client,
  table: SyncedTable<L, R>,
) {
  // Dexie's key-path generics can't be resolved for an open type parameter, so the engine
  // works on the Syncable view of the table: it only reads id, pending and updatedAt.
  const local = table.local as unknown as Table<Syncable, string>
  const pending = (await local.where('pending').equals(1).toArray()) as L[]
  if (pending.length === 0) return

  const { error } = await client
    .from(table.name)
    .upsert(pending.map(table.toRow), table.onConflict ? { onConflict: table.onConflict } : {})
  if (error) throw error

  const sent = new Map(pending.map((r) => [r.id, r.updatedAt]))
  await local
    .where('id')
    .anyOf([...sent.keys()])
    .filter((r) => r.updatedAt === sent.get(r.id))
    .modify({ pending: 0 })
}

// Where the last pull stopped: the last row's synced_at, and its id to break ties. One upload
// stamps all its rows with the same synced_at (Postgres' now() is the transaction's start), so
// paging by synced_at alone skipped the rest of a tie that ran past a page's end.
interface Cursor {
  at: string // kept as the server wrote it: parsing it would drop the microseconds
  id: string
}

// v1 cursors were synced_at alone. Starting over with v2 pulls everything once, which also
// brings back any row a v1 cursor skipped.
const cursorKey = (table: string) => `${table}-cursor-v2`
const legacyCursorKey = (table: string) => `${table}-cursor`

// Downloads everything that changed on the server since the last pull, page by page.
// The cursor is the server's synced_at, so rows uploaded late by an offline device aren't missed.
export async function pullTable<L extends Syncable, R extends ServerRow>(
  client: Client,
  table: SyncedTable<L, R>,
  pageSize = DEFAULT_PAGE_SIZE,
) {
  // Dexie's key-path generics can't be resolved for an open type parameter, so the engine
  // works on the Syncable view of the table: it only reads id, pending and updatedAt.
  const local = table.local as unknown as Table<Syncable, string>
  const key = cursorKey(table.name)
  const stored = (await db.syncState.get(key))?.value
  let cursor: Cursor | null = stored ? JSON.parse(stored) : null
  if (!cursor) await db.syncState.delete(legacyCursorKey(table.name))

  for (;;) {
    const select = client.from(table.name).select(table.columns)
    // After the cursor: a later synced_at, or the same one and a later id
    const after = cursor
      ? select.or(
          `synced_at.gt."${cursor.at}",and(synced_at.eq."${cursor.at}",id.gt."${cursor.id}")`,
        )
      : select.gt('synced_at', EPOCH)
    const { data, error } = await after.order('synced_at').order('id').limit(pageSize)
    if (error) throw error
    const rows = data as unknown as R[]
    if (rows.length === 0) return

    await db.transaction('rw', local, db.syncState, async () => {
      for (const row of rows) {
        const incoming = table.fromRow(row)
        const existing = await local.get(incoming.id)
        // A newer local change that hasn't been uploaded yet wins
        if (existing?.pending && Date.parse(existing.updatedAt) > Date.parse(incoming.updatedAt)) {
          continue
        }
        await local.put(incoming)
      }
      const last = rows[rows.length - 1]
      cursor = { at: last.synced_at, id: last.id }
      await db.syncState.put({ key, value: JSON.stringify(cursor) })
    })

    if (rows.length < pageSize) return
  }
}
