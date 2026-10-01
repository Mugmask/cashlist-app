import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, type Expense } from '@/lib/db'
import { pullTable, pushTable, toSyncTask } from './engine'
import { expensesTable } from './tables'

interface Payload {
  id: string
  updated_at: string
  [column: string]: unknown
}
type Row = Payload & { synced_at: string }

// In-memory stand-in for Supabase that mimics the server trigger: it stamps synced_at
// and ignores updates older than the stored row (last write wins). Like Postgres' now(), one
// upsert stamps all its rows with the same synced_at (the transaction's start).

// The pull's filter: `synced_at.gt."X",and(synced_at.eq."X",id.gt."Y")`
const AFTER = /^synced_at\.gt\."([^"]+)",and\(synced_at\.eq\."([^"]+)",id\.gt\."([^"]+)"\)$/
function createFakeServer() {
  const rows = new Map<string, Row>()
  let clock = 0
  let failUpserts = false
  let invalid: ((row: Payload) => boolean) | null = null
  let onUpsert: (() => Promise<void>) | null = null

  const stamp = () => new Date(Date.UTC(2026, 0, 1) + ++clock * 1000).toISOString()

  const client = {
    from: () => ({
      async upsert(payload: Payload[]) {
        await onUpsert?.()
        if (failUpserts) return { error: { message: 'upsert failed' } }
        // Like Postgres: one invalid row rejects the whole statement
        if (invalid && payload.some(invalid)) {
          return { error: { code: '22003', message: 'numeric field overflow' } }
        }
        const at = stamp()
        for (const incoming of payload) {
          const existing = rows.get(incoming.id)
          if (existing && incoming.updated_at < existing.updated_at) continue
          rows.set(incoming.id, { ...existing, ...incoming, synced_at: at })
        }
        return { error: null }
      },
      select() {
        let keep = (_r: Row) => true
        let max = Infinity
        const query = {
          gt: (_column: string, value: string) => ((keep = (r) => r.synced_at > value), query),
          or: (filter: string) => {
            const [, at, , id] = filter.match(AFTER) ?? []
            if (!at) throw new Error(`unexpected filter: ${filter}`)
            keep = (r) => r.synced_at > at || (r.synced_at === at && r.id > id)
            return query
          },
          order: () => query,
          limit: (n: number) => ((max = n), query),
          then: (resolve: (r: { data: Row[]; error: null }) => unknown) =>
            resolve({
              data: [...rows.values()]
                .filter(keep)
                .sort((a, b) => a.synced_at.localeCompare(b.synced_at) || a.id.localeCompare(b.id))
                .slice(0, max),
              error: null,
            }),
        }
        return query
      },
    }),
  }

  return {
    client: client as unknown as SupabaseClient,
    rows,
    // Simulates another device writing straight to the server
    remoteWrite: (row: Payload) => rows.set(row.id, { ...row, synced_at: stamp() }),
    failUpserts: (fail: boolean) => (failUpserts = fail),
    rejectRows: (test: (row: Payload) => boolean) => (invalid = test),
    beforeUpsert: (fn: () => Promise<void>) => (onUpsert = fn),
  }
}

function localExpense(id: string, updatedAt: string, patch: Partial<Expense> = {}): Expense {
  return {
    id,
    amount: 100,
    category: 'other',
    spentAt: updatedAt,
    updatedAt,
    deleted: false,
    pending: 1,
    ...patch,
  }
}

function remoteExpense(id: string, updatedAt: string, amount = 100) {
  return {
    id,
    amount,
    category: 'other',
    spent_at: updatedAt,
    note: null,
    updated_at: updatedAt,
    deleted: false,
  }
}

let server: ReturnType<typeof createFakeServer>

beforeEach(async () => {
  await db.expenses.clear()
  await db.syncState.clear()
  server = createFakeServer()
})

describe('pushTable', () => {
  it('uploads pending rows and clears their pending flag', async () => {
    await db.expenses.add(localExpense('a', '2026-09-01T10:00:00.000Z'))

    await pushTable(server.client, expensesTable)

    expect(server.rows.get('a')).toMatchObject({
      id: 'a',
      amount: 100,
      spent_at: expect.any(String),
    })
    expect((await db.expenses.get('a'))?.pending).toBe(0)
  })

  it('keeps a row pending if it was edited again while uploading', async () => {
    await db.expenses.add(localExpense('a', '2026-09-01T10:00:00.000Z'))
    server.beforeUpsert(async () => {
      await db.expenses.update('a', { amount: 999, updatedAt: '2026-09-01T10:05:00.000Z' })
    })

    await pushTable(server.client, expensesTable)

    expect(await db.expenses.get('a')).toMatchObject({ amount: 999, pending: 1 })
  })

  it('throws and keeps rows pending when the upload fails', async () => {
    await db.expenses.add(localExpense('a', '2026-09-01T10:00:00.000Z'))
    server.failUpserts(true)

    await expect(pushTable(server.client, expensesTable)).rejects.toMatchObject({
      message: 'upsert failed',
    })
    expect((await db.expenses.get('a'))?.pending).toBe(1)
  })
})

describe('a row the server rejects', () => {
  // A row Postgres refuses (a value out of range, say) made it refuse the whole batch: every
  // pending change of the table stayed stuck, and nothing came down for it either
  it('stays pending alone: the rest uploads, and the table still pulls', async () => {
    server.rejectRows((row) => row.id === 'bad')
    await db.expenses.bulkAdd([
      localExpense('bad', '2026-01-01T00:00:00.000Z'),
      localExpense('ok-1', '2026-01-01T00:00:00.000Z'),
      localExpense('ok-2', '2026-01-01T00:00:00.000Z'),
    ])
    server.remoteWrite(remoteExpense('from-elsewhere', '2026-01-01T00:00:00.000Z'))

    await expect(toSyncTask(expensesTable).run(server.client)).rejects.toMatchObject({
      code: '22003',
    })

    expect([...server.rows.keys()].sort()).toEqual(['from-elsewhere', 'ok-1', 'ok-2'])
    expect((await db.expenses.get('bad'))?.pending).toBe(1)
    expect((await db.expenses.get('ok-1'))?.pending).toBe(0)
    expect(await db.expenses.get('from-elsewhere')).toBeDefined()
  })

  it('a network failure is not retried row by row', async () => {
    server.failUpserts(true)
    await db.expenses.bulkAdd([
      localExpense('a', '2026-01-01T00:00:00.000Z'),
      localExpense('b', '2026-01-01T00:00:00.000Z'),
    ])
    let calls = 0
    server.beforeUpsert(async () => void calls++)

    await expect(pushTable(server.client, expensesTable)).rejects.toMatchObject({
      message: 'upsert failed',
    })
    expect(calls).toBe(1)
  })
})

describe('pullTable', () => {
  // A batch uploaded in one request shares its synced_at. Paging by synced_at alone, the rows
  // of a tie that fell past a page's end were skipped by the next page's synced_at > cursor.
  it('starts over once from a v1 cursor, bringing back rows it skipped', async () => {
    server.remoteWrite(remoteExpense('skipped', '2026-01-01T00:00:00.000Z'))
    // A v1 cursor already past that row, as if a tie had made it skip it
    await db.syncState.put({ key: 'expenses-cursor', value: '2099-01-01T00:00:00.000Z' })

    await pullTable(server.client, expensesTable)

    expect(await db.expenses.get('skipped')).toBeDefined()
    expect(await db.syncState.get('expenses-cursor')).toBeUndefined()
  })

  it('brings every row of a tie that spans pages', async () => {
    await db.expenses.bulkAdd(
      ['a', 'b', 'c', 'd', 'e'].map((id) => localExpense(id, '2026-01-01T00:00:00.000Z')),
    )
    await pushTable(server.client, expensesTable)
    await db.expenses.clear() // "another device" with an empty database
    await db.syncState.clear()

    await pullTable(server.client, expensesTable, 2)

    expect((await db.expenses.toArray()).map((e) => e.id).sort()).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('downloads remote rows and only fetches newer ones on the next pull', async () => {
    server.remoteWrite(remoteExpense('a', '2026-09-01T10:00:00.000Z', 50))
    await pullTable(server.client, expensesTable)
    expect(await db.expenses.get('a')).toMatchObject({ amount: 50, pending: 0 })

    await db.expenses.update('a', { amount: 1 }) // local-only tweak, to detect a re-download
    server.remoteWrite(remoteExpense('b', '2026-09-02T10:00:00.000Z', 70))
    await pullTable(server.client, expensesTable)

    expect((await db.expenses.get('a'))?.amount).toBe(1) // not fetched again
    expect((await db.expenses.get('b'))?.amount).toBe(70)
  })

  it('does not overwrite a newer local change that is still pending', async () => {
    await db.expenses.add(localExpense('a', '2026-09-01T12:00:00.000Z', { amount: 999 }))
    server.remoteWrite(remoteExpense('a', '2026-09-01T10:00:00.000Z', 50))

    await pullTable(server.client, expensesTable)

    expect(await db.expenses.get('a')).toMatchObject({ amount: 999, pending: 1 })
  })

  it('takes the remote version when it is newer than a pending local one', async () => {
    await db.expenses.add(localExpense('a', '2026-09-01T10:00:00.000Z', { amount: 999 }))
    server.remoteWrite(remoteExpense('a', '2026-09-01T12:00:00.000Z', 50))

    await pullTable(server.client, expensesTable)

    expect(await db.expenses.get('a')).toMatchObject({ amount: 50, pending: 0 })
  })

  it('pages through more rows than the page size', async () => {
    for (let i = 0; i < 7; i++) {
      server.remoteWrite(remoteExpense(`r${i}`, `2026-09-0${i + 1}T10:00:00.000Z`))
    }

    await pullTable(server.client, expensesTable, 3)

    expect(await db.expenses.count()).toBe(7)
  })

  it('round-trips: what one device pushes, another pulls', async () => {
    await db.expenses.add(localExpense('a', '2026-09-01T10:00:00.000Z', { note: 'feria' }))
    await pushTable(server.client, expensesTable)

    await db.expenses.clear() // "another device" with an empty database
    await db.syncState.clear()
    await pullTable(server.client, expensesTable)

    expect(await db.expenses.get('a')).toMatchObject({ note: 'feria', amount: 100, pending: 0 })
  })
})
