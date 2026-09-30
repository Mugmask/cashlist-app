import { db, type Expense } from '@/lib/db'
import { supabase } from '@/lib/supabase'

const CURSOR_KEY = 'expenses-cursor'
const PAGE_SIZE = 500

interface ExpenseRow {
  id: string
  amount: number
  category: string
  spent_at: string
  note: string | null
  updated_at: string
  deleted: boolean
  synced_at: string
}

let inFlight: Promise<void> | null = null

// Prevents two syncs running in parallel: if one is already running, returns that one
export function runSync() {
  inFlight ??= pushAndPull().finally(() => {
    inFlight = null
  })
  return inFlight
}

async function pushAndPull() {
  if (!supabase || !navigator.onLine) return
  const { data } = await supabase.auth.getSession()
  if (!data.session) return

  await push()
  await pull()
}

async function push() {
  const pending = await db.expenses.where('pending').equals(1).toArray()
  if (pending.length === 0) return

  const { error } = await supabase!.from('expenses').upsert(pending.map(toRow))
  if (error) throw error

  // Only mark as uploaded if they weren't edited again while uploading
  const sent = new Map(pending.map((e) => [e.id, e.updatedAt]))
  await db.expenses
    .where('id')
    .anyOf([...sent.keys()])
    .filter((e) => e.updatedAt === sent.get(e.id))
    .modify({ pending: 0 })
}

async function pull() {
  let cursor = (await db.syncState.get(CURSOR_KEY))?.value ?? '1970-01-01T00:00:00Z'

  for (;;) {
    const { data, error } = await supabase!
      .from('expenses')
      .select('id, amount, category, spent_at, note, updated_at, deleted, synced_at')
      .gt('synced_at', cursor)
      .order('synced_at')
      .limit(PAGE_SIZE)
    if (error) throw error
    const rows = data as ExpenseRow[]
    if (rows.length === 0) return

    await db.transaction('rw', db.expenses, db.syncState, async () => {
      for (const row of rows) {
        const local = await db.expenses.get(row.id)
        // A newer local change that hasn't been uploaded yet wins
        if (local?.pending && Date.parse(local.updatedAt) > Date.parse(row.updated_at)) continue
        await db.expenses.put(fromRow(row))
      }
      cursor = rows[rows.length - 1].synced_at
      await db.syncState.put({ key: CURSOR_KEY, value: cursor })
    })

    if (rows.length < PAGE_SIZE) return
  }
}

function toRow(e: Expense) {
  return {
    id: e.id,
    amount: e.amount,
    category: e.category,
    spent_at: e.spentAt,
    note: e.note ?? null,
    updated_at: e.updatedAt,
    deleted: e.deleted,
  }
}

function fromRow(row: ExpenseRow): Expense {
  return {
    id: row.id,
    amount: Number(row.amount),
    category: row.category,
    spentAt: row.spent_at,
    note: row.note ?? undefined,
    updatedAt: row.updated_at,
    deleted: row.deleted,
    pending: 0,
  }
}
