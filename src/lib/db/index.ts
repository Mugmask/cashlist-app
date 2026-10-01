import Dexie, { type EntityTable } from 'dexie'
import { normalizeName } from '@/utils/text'

// Fields every record synced with Supabase needs
export interface Syncable {
  id: string // generated on the client (a UUID, or a natural key like a category id)
  updatedAt: string // ISO, decides which version wins a conflict (last write wins)
  deleted: boolean // soft delete, so deletions sync too
  pending: 0 | 1 // 1 = local change not uploaded yet (a number because IndexedDB can't index booleans)
}

// Cash covers debit and transfers too: money that leaves right away. Card spending of a month
// is paid in one statement the next month. Missing means cash (rows from before cards existed).
export type PaymentMethod = 'cash' | 'card'

// Which dollar a rate is (dolarapi.com's names): card purchases go at "tarjeta", cash at "blue"
export type ExchangeRateKind = 'tarjeta' | 'blue' | 'oficial'

export interface Expense extends Syncable {
  amount: number
  category: string
  spentAt: string // ISO
  name?: string // "Nafta", "Alquiler": what the lists show; the category when missing
  note?: string // a free comment, only in the detail
  // Set when this expense is the payment of a fixed expense for a given month
  fixedExpenseId?: string
  fixedPeriod?: string // "2026-09": the month it pays, which may differ from spentAt's month
  paymentMethod?: PaymentMethod
  // Set only for an expense in dollars. `amount` is still in pesos (foreignAmount × rate),
  // so every total keeps adding pesos; lists show the dollars.
  currency?: 'USD' // missing means pesos
  foreignAmount?: number // what was charged, in dollars
  exchangeRate?: number // pesos per dollar when it was loaded
  exchangeRateKind?: ExchangeRateKind
  // A card purchase in installments: how many (2 or more). `amount` is still the total, and
  // it counts whole in the month it was bought; each statement charges one installment.
  installments?: number
}

// Money that comes in apart from the profile's monthly income (a transfer back, a sale...):
// it adds to what its month has to spend. In pesos.
export interface Income extends Syncable {
  amount: number
  receivedAt: string // ISO
  name?: string // "Trabajo extra", "Venta"
  note?: string
}

// Something cooked often and what it takes. Ingredients are shopping products with a count,
// like the list ("Papa x4"): cooking it puts the missing ones on the list.
export interface RecipeIngredient {
  name: string
  quantity: number
}

export interface Recipe extends Syncable {
  name: string
  ingredients: RecipeIngredient[]
}

// A category the user made, besides the built-in ones. Icon and color are picked from short
// lists (a key of CATEGORY_ICONS, a palette index from 1 to 8) so charts stay readable.
export interface CustomCategory extends Syncable {
  name: string
  icon: string
  color: number
}

// The user's profile, a single row ('me'). Monthly income is in pesos.
export interface Profile extends Syncable {
  name?: string
  monthlyIncome?: number
}

// Something charged every month (rent, internet...). Its amount is the one suggested next
// time, and is updated whenever a payment is made with a different amount.
export interface FixedExpense extends Syncable {
  name: string
  category: string
  amount: number
  paymentMethod?: PaymentMethod // how its payments are made
  // Charged in dollars (Netflix, Spotify...): then `amount` is in dollars, and each payment
  // is a dollar expense converted at that day's rate
  currency?: 'USD' // missing means pesos
}

// A card statement marked as paid. The id is the month of the purchases ("2026-09").
// Paying it isn't an expense: the purchases were counted when they were made.
export interface CardStatement extends Syncable {
  paidAt: string // ISO
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
  incomes: EntityTable<Income, 'id'>
  categories: EntityTable<CustomCategory, 'id'>
  recipes: EntityTable<Recipe, 'id'>
  shoppingItems: EntityTable<ShoppingItem, 'id'>
  fixedExpenses: EntityTable<FixedExpense, 'id'>
  cardStatements: EntityTable<CardStatement, 'id'>
  profile: EntityTable<Profile, 'id'>
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
  Salidas: 'personal', // folded into Personales
  Salud: 'personal',
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

// v8: budgets were removed from the app. The local copy goes; the Supabase table and its
// rows are kept, in case the feature comes back.
db.version(8).stores({
  budgets: null,
})

// v9: credit card statements (payment methods need no migration: missing means cash)
db.version(9).stores({
  cardStatements: 'id, pending',
})

// v10: the profile (dollar expenses need no migration: missing currency means pesos)
db.version(10).stores({
  profile: 'id, pending',
})

// v11: expenses get a name apart from the note. Every note so far was really a name (a
// merchant, a fixed expense's name, "Compra de 4 productos"), so it moves there. The server
// moves its copy the same way (migration 13); rows stay as they are sync-wise.
db.version(11).upgrade(async (tx) => {
  await tx
    .table('expenses')
    .toCollection()
    .modify((e: Expense) => {
      if (e.note === undefined || e.name !== undefined) return
      e.name = e.note
      delete e.note
    })
})

// v12: incomes apart from the monthly income
db.version(12).stores({
  incomes: 'id, receivedAt, pending',
})

// v13: categories the user makes
db.version(13).stores({
  categories: 'id, pending',
})

// v14: recipes, to put what they take on the shopping list
db.version(14).stores({
  recipes: 'id, pending',
})

// The local database holds one user's data at a time. The owner is kept next to the sync
// cursors, so clearing everything also forgets who it belonged to.
const OWNER_KEY = 'owner'

export async function clearLocalData() {
  await db.transaction('rw', db.tables, () => Promise.all(db.tables.map((t) => t.clear())))
}

// Changes not uploaded yet: signing out now would lose them
export async function countPendingChanges() {
  const tables = db.tables.filter((t) => t.schema.idxByName.pending)
  const counts = await Promise.all(tables.map((t) => t.where('pending').equals(1).count()))
  return counts.reduce((a, b) => a + b, 0)
}

// Marks the local data as this user's. If it belonged to someone else (a session that
// expired without signing out, say) it's cleared first, so it never syncs into this account.
export async function claimLocalData(userId: string) {
  await db.transaction('rw', db.tables, async () => {
    const owner = await db.syncState.get(OWNER_KEY)
    if (owner?.value === userId) return
    if (owner) await Promise.all(db.tables.map((t) => t.clear()))
    await db.syncState.put({ key: OWNER_KEY, value: userId })
  })
}

// Asks the browser not to evict IndexedDB when storage runs low
export async function requestPersistentStorage() {
  if (navigator.storage?.persist) await navigator.storage.persist()
}
