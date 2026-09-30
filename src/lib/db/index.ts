import Dexie, { type EntityTable } from 'dexie'
import { normalizeName } from '@/utils/text'

// Fields every record synced with Supabase needs
export interface Syncable {
  id: string // generated on the client (a UUID, or a natural key like a category id)
  updatedAt: string // ISO, decides which version wins a conflict (last write wins)
  deleted: boolean // soft delete, so deletions sync too
  pending: 0 | 1 // 1 = local change not uploaded yet (a number because IndexedDB can't index booleans)
}

export interface Expense extends Syncable {
  amount: number
  category: string
  spentAt: string // ISO
  note?: string
  // Set when this expense is the payment of a fixed expense for a given month
  fixedExpenseId?: string
  fixedPeriod?: string // "2026-09": the month it pays, which may differ from spentAt's month
}

// Something charged every month (rent, internet...). Its amount is the one suggested next
// time, and is updated whenever a payment is made with a different amount.
export interface FixedExpense extends Syncable {
  name: string
  category: string
  amount: number
  dueDay?: number // 1-31, day of the month it's due
}

// Monthly limit for one expense category. The id is the category id, so there's at most
// one budget per category and two devices setting the same one converge.
export interface Budget extends Syncable {
  amount: number
}

export type ShoppingItemStatus = 'in_stock' | 'to_buy' | 'in_cart'

// A product in the pantry. One row per product, cycling in_stock → to_buy → in_cart → in_stock:
// marking it as run out puts it back on the list.
export interface ShoppingItem extends Syncable {
  name: string
  quantity: number // how many to buy, while on the list
  status: ShoppingItemStatus
  lastBoughtAt?: string // ISO
  timesBought: number
}

interface SyncState {
  key: string
  value: string
}

export const db = new Dexie('cashlist') as Dexie & {
  expenses: EntityTable<Expense, 'id'>
  budgets: EntityTable<Budget, 'id'>
  shoppingItems: EntityTable<ShoppingItem, 'id'>
  fixedExpenses: EntityTable<FixedExpense, 'id'>
  syncState: EntityTable<SyncState, 'key'>
}

db.version(1).stores({
  gastos: 'id, categoria, fecha, updatedAt',
})

db.version(2).stores({
  gastos: 'id, categoria, fecha, updatedAt, pendiente',
  meta: 'clave',
})

// v3: Spanish schema → English schema. Copies the legacy rows; v4 drops the old tables.
// The sync cursor is not copied on purpose: the next sync does a full pull of the renamed table.
const LEGACY_CATEGORIES: Record<string, string> = {
  Súper: 'groceries',
  Delivery: 'delivery',
  Alquiler: 'rent',
  Servicios: 'utilities',
  Transporte: 'transport',
  Salidas: 'going_out',
  Salud: 'health',
  Otros: 'other',
}

interface LegacyGasto {
  id: string
  monto: number
  categoria: string
  fecha: string
  nota?: string
  updatedAt: string
  deleted: boolean
  pendiente: 0 | 1
}

db.version(3)
  .stores({
    expenses: 'id, category, spentAt, updatedAt, pending',
    syncState: 'key',
  })
  .upgrade(async (tx) => {
    const legacy: LegacyGasto[] = await tx.table('gastos').toArray()
    await tx.table('expenses').bulkPut(
      legacy.map((g): Expense => ({
        id: g.id,
        amount: g.monto,
        category: LEGACY_CATEGORIES[g.categoria] ?? 'other',
        spentAt: g.fecha,
        note: g.nota,
        updatedAt: g.updatedAt,
        deleted: g.deleted,
        pending: g.pendiente,
      })),
    )
  })

db.version(4).stores({
  gastos: null,
  meta: null,
})

db.version(5).stores({
  budgets: 'id, pending',
})

db.version(6).stores({
  shoppingItems: 'id, status, pending',
})

interface ShoppingItemV6 {
  id: string
  name: string
  quantity: number
  status: 'to_buy' | 'in_cart' | 'bought'
  boughtAt?: string
  updatedAt: string
  deleted: boolean
  pending: 0 | 1
}

// v7: fixed expenses, and the shopping list becomes a pantry (one row per product).
// "bought" history rows become in-stock products; repeated products collapse into one,
// keeping the one on the list if any, else the most recent. Everything is re-uploaded
// (pending) and the cursor reset, since the server schema changes at the same time.
db.version(7)
  .stores({
    expenses: 'id, category, spentAt, updatedAt, pending, fixedPeriod',
    fixedExpenses: 'id, pending',
  })
  .upgrade(async (tx) => {
    const table = tx.table('shoppingItems')
    const rows: ShoppingItemV6[] = await table.toArray()
    const now = new Date().toISOString()
    const rank = (r: ShoppingItemV6) => (r.status === 'bought' ? 0 : 1)
    const keep = new Map<string, ShoppingItemV6>()
    for (const row of rows.filter((r) => !r.deleted)) {
      const key = normalizeName(row.name)
      const current = keep.get(key)
      if (
        !current ||
        rank(row) > rank(current) ||
        (rank(row) === rank(current) && row.updatedAt > current.updatedAt)
      ) {
        keep.set(key, row)
      }
    }
    const kept = new Set([...keep.values()].map((r) => r.id))
    const timesBoughtBy = new Map<string, number>()
    for (const row of rows) {
      if (row.status !== 'bought' || row.deleted) continue
      const key = normalizeName(row.name)
      timesBoughtBy.set(key, (timesBoughtBy.get(key) ?? 0) + 1)
    }

    await table.bulkPut(
      rows.map((row): ShoppingItem => {
        const timesBought = timesBoughtBy.get(normalizeName(row.name)) ?? 0
        return {
          id: row.id,
          name: row.name,
          quantity: row.status === 'bought' ? 1 : row.quantity,
          status: row.status === 'bought' ? 'in_stock' : row.status,
          lastBoughtAt: row.boughtAt,
          timesBought,
          updatedAt: kept.has(row.id) ? row.updatedAt : now,
          deleted: row.deleted || !kept.has(row.id),
          pending: 1,
        }
      }),
    )
    await tx.table('syncState').delete('shopping_items-cursor')
  })

// Asks the browser not to evict IndexedDB when storage runs low
export async function requestPersistentStorage() {
  if (navigator.storage?.persist) await navigator.storage.persist()
}
