import {
  db,
  type CustomCategory,
  type ExchangeRateKind,
  type Expense,
  type FixedExpense,
  type Income,
  type PaymentMethod,
  type Profile,
  type Recipe,
  type RecipeIngredient,
  type ShoppingItem,
  type ShoppingItemStatus,
} from '@/lib/db'
import { toSyncTask, type SyncedTable } from './engine'

interface ExpenseRow {
  id: string
  amount: number | string // numeric can come back as a string
  category: string
  spent_at: string
  name: string | null
  note: string | null
  fixed_expense_id: string | null
  fixed_period: string | null
  payment_method: PaymentMethod
  currency: 'ARS' | 'USD'
  foreign_amount: number | string | null
  exchange_rate: number | string | null
  exchange_rate_kind: ExchangeRateKind | null
  installments: number | null
  shared_total: number | string | null
  updated_at: string
  deleted: boolean
  synced_at: string
}

export const expensesTable: SyncedTable<Expense, ExpenseRow> = {
  name: 'expenses',
  local: db.expenses,
  columns:
    'id, amount, category, spent_at, name, note, fixed_expense_id, fixed_period, payment_method, currency, foreign_amount, exchange_rate, exchange_rate_kind, installments, shared_total, updated_at, deleted, synced_at',
  toRow: (e) => ({
    id: e.id,
    amount: e.amount,
    category: e.category,
    spent_at: e.spentAt,
    name: e.name ?? null,
    note: e.note ?? null,
    fixed_expense_id: e.fixedExpenseId ?? null,
    fixed_period: e.fixedPeriod ?? null,
    payment_method: e.paymentMethod ?? 'cash',
    currency: e.currency ?? 'ARS',
    foreign_amount: e.foreignAmount ?? null,
    exchange_rate: e.exchangeRate ?? null,
    exchange_rate_kind: e.exchangeRateKind ?? null,
    installments: e.installments ?? null,
    shared_total: e.sharedTotal ?? null,
    updated_at: e.updatedAt,
    deleted: e.deleted,
  }),
  fromRow: (row) => ({
    id: row.id,
    amount: Number(row.amount),
    category: row.category,
    spentAt: row.spent_at,
    name: row.name ?? undefined,
    note: row.note ?? undefined,
    fixedExpenseId: row.fixed_expense_id ?? undefined,
    fixedPeriod: row.fixed_period ?? undefined,
    paymentMethod: row.payment_method,
    ...(row.currency === 'USD' && {
      currency: 'USD' as const,
      foreignAmount: Number(row.foreign_amount),
      exchangeRate: Number(row.exchange_rate),
      exchangeRateKind: row.exchange_rate_kind ?? 'blue',
    }),
    ...(row.installments !== null && { installments: row.installments }),
    ...(row.shared_total !== null && { sharedTotal: Number(row.shared_total) }),
    updatedAt: row.updated_at,
    deleted: row.deleted,
    pending: 0,
  }),
}

interface IncomeRow {
  id: string
  amount: number | string // numeric can come back as a string
  received_at: string
  name: string | null
  note: string | null
  updated_at: string
  deleted: boolean
  synced_at: string
}

const incomesTable: SyncedTable<Income, IncomeRow> = {
  name: 'incomes',
  local: db.incomes,
  columns: 'id, amount, received_at, name, note, updated_at, deleted, synced_at',
  toRow: (i) => ({
    id: i.id,
    amount: i.amount,
    received_at: i.receivedAt,
    name: i.name ?? null,
    note: i.note ?? null,
    updated_at: i.updatedAt,
    deleted: i.deleted,
  }),
  fromRow: (row) => ({
    id: row.id,
    amount: Number(row.amount),
    receivedAt: row.received_at,
    name: row.name ?? undefined,
    note: row.note ?? undefined,
    updatedAt: row.updated_at,
    deleted: row.deleted,
    pending: 0,
  }),
}

interface CategoryRow {
  id: string
  name: string
  icon: string
  color: number
  custom_color: string | null
  builtin: string | null
  updated_at: string
  deleted: boolean
  synced_at: string
}

export const categoriesTable: SyncedTable<CustomCategory, CategoryRow> = {
  name: 'categories',
  local: db.categories,
  columns: 'id, name, icon, color, custom_color, builtin, updated_at, deleted, synced_at',
  toRow: (c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    color: c.color,
    custom_color: c.customColor ?? null,
    builtin: c.builtIn ?? null,
    updated_at: c.updatedAt,
    deleted: c.deleted,
  }),
  fromRow: (row) => ({
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    ...(row.custom_color && { customColor: row.custom_color }),
    ...(row.builtin && { builtIn: row.builtin }),
    updatedAt: row.updated_at,
    deleted: row.deleted,
    pending: 0,
  }),
}

interface RecipeRow {
  id: string
  name: string
  ingredients: RecipeIngredient[]
  updated_at: string
  deleted: boolean
  synced_at: string
}

const recipesTable: SyncedTable<Recipe, RecipeRow> = {
  name: 'recipes',
  local: db.recipes,
  columns: 'id, name, ingredients, updated_at, deleted, synced_at',
  toRow: (r) => ({
    id: r.id,
    name: r.name,
    ingredients: r.ingredients,
    updated_at: r.updatedAt,
    deleted: r.deleted,
  }),
  fromRow: (row) => ({
    id: row.id,
    name: row.name,
    ingredients: row.ingredients ?? [],
    updatedAt: row.updated_at,
    deleted: row.deleted,
    pending: 0,
  }),
}

interface ShoppingItemRow {
  id: string
  name: string
  quantity: number
  status: ShoppingItemStatus
  last_bought_at: string | null
  times_bought: number
  aisle: string | null
  updated_at: string
  deleted: boolean
  synced_at: string
}

export const shoppingItemsTable: SyncedTable<ShoppingItem, ShoppingItemRow> = {
  name: 'shopping_items',
  local: db.shoppingItems,
  columns:
    'id, name, quantity, status, last_bought_at, times_bought, aisle, updated_at, deleted, synced_at',
  toRow: (i) => ({
    id: i.id,
    name: i.name,
    quantity: i.quantity,
    status: i.status,
    last_bought_at: i.lastBoughtAt ?? null,
    // Some local rows lack it (or got NaN from += 1 on it): the column is not null. Sent as 0,
    // the next pull brings it back fixed.
    times_bought: Number.isInteger(i.timesBought) ? i.timesBought : 0,
    aisle: i.aisle ?? null,
    updated_at: i.updatedAt,
    deleted: i.deleted,
  }),
  fromRow: (row) => ({
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    status: row.status,
    lastBoughtAt: row.last_bought_at ?? undefined,
    timesBought: row.times_bought,
    ...(row.aisle !== null && { aisle: row.aisle }),
    updatedAt: row.updated_at,
    deleted: row.deleted,
    pending: 0,
  }),
}

interface FixedExpenseRow {
  id: string
  name: string
  category: string
  amount: number | string
  payment_method: PaymentMethod
  currency: 'ARS' | 'USD'
  due_day: number | null
  share_with: number | null
  share_part: number | string | null
  note: string | null
  updated_at: string
  deleted: boolean
  synced_at: string
}

const fixedExpensesTable: SyncedTable<FixedExpense, FixedExpenseRow> = {
  name: 'fixed_expenses',
  local: db.fixedExpenses,
  columns:
    'id, name, category, amount, payment_method, currency, due_day, share_with, share_part, note, updated_at, deleted, synced_at',
  toRow: (f) => ({
    id: f.id,
    name: f.name,
    category: f.category,
    amount: f.amount,
    payment_method: f.paymentMethod ?? 'cash',
    currency: f.currency ?? 'ARS',
    due_day: f.dueDay ?? null,
    share_with: f.shareWith ?? null,
    share_part: f.sharePart ?? null,
    note: f.note ?? null,
    updated_at: f.updatedAt,
    deleted: f.deleted,
  }),
  fromRow: (row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    amount: Number(row.amount),
    paymentMethod: row.payment_method,
    ...(row.currency === 'USD' && { currency: 'USD' as const }),
    ...(row.due_day !== null && { dueDay: row.due_day }),
    ...(row.share_with !== null && { shareWith: row.share_with }),
    ...(row.share_part !== null && { sharePart: Number(row.share_part) }),
    ...(row.note !== null && { note: row.note }),
    updatedAt: row.updated_at,
    deleted: row.deleted,
    pending: 0,
  }),
}

interface ProfileRow {
  id: string
  name: string | null
  monthly_income: number | string | null
  aisle_names: Record<string, string> | null
  updated_at: string
  deleted: boolean
  synced_at: string
}

const profileTable: SyncedTable<Profile, ProfileRow> = {
  name: 'profiles',
  local: db.profile,
  columns: 'id, name, monthly_income, aisle_names, updated_at, deleted, synced_at',
  onConflict: 'user_id,id', // composite primary key; user_id comes from auth.uid()
  toRow: (p) => ({
    id: p.id,
    name: p.name ?? null,
    monthly_income: p.monthlyIncome ?? null,
    aisle_names: p.aisleNames ?? null,
    updated_at: p.updatedAt,
    deleted: p.deleted,
  }),
  fromRow: (row) => ({
    id: row.id,
    name: row.name ?? undefined,
    monthlyIncome: row.monthly_income === null ? undefined : Number(row.monthly_income),
    ...(row.aisle_names && { aisleNames: row.aisle_names }),
    updatedAt: row.updated_at,
    deleted: row.deleted,
    pending: 0,
  }),
}

// Every synced table; each one syncs independently of the others
export const SYNCED_TABLES = [
  toSyncTask(expensesTable),
  toSyncTask(incomesTable),
  toSyncTask(categoriesTable),
  toSyncTask(shoppingItemsTable),
  toSyncTask(recipesTable),
  toSyncTask(fixedExpensesTable),
  toSyncTask(profileTable),
]
