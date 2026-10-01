import {
  db,
  type CardStatement,
  type CustomCategory,
  type ExchangeRateKind,
  type Expense,
  type FixedExpense,
  type Income,
  type PaymentMethod,
  type Profile,
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
  updated_at: string
  deleted: boolean
  synced_at: string
}

export const expensesTable: SyncedTable<Expense, ExpenseRow> = {
  name: 'expenses',
  local: db.expenses,
  columns:
    'id, amount, category, spent_at, name, note, fixed_expense_id, fixed_period, payment_method, currency, foreign_amount, exchange_rate, exchange_rate_kind, installments, updated_at, deleted, synced_at',
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

export const incomesTable: SyncedTable<Income, IncomeRow> = {
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
  updated_at: string
  deleted: boolean
  synced_at: string
}

export const categoriesTable: SyncedTable<CustomCategory, CategoryRow> = {
  name: 'categories',
  local: db.categories,
  columns: 'id, name, icon, color, updated_at, deleted, synced_at',
  toRow: (c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    color: c.color,
    updated_at: c.updatedAt,
    deleted: c.deleted,
  }),
  fromRow: (row) => ({
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
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
  updated_at: string
  deleted: boolean
  synced_at: string
}

export const shoppingItemsTable: SyncedTable<ShoppingItem, ShoppingItemRow> = {
  name: 'shopping_items',
  local: db.shoppingItems,
  columns:
    'id, name, quantity, status, last_bought_at, times_bought, updated_at, deleted, synced_at',
  toRow: (i) => ({
    id: i.id,
    name: i.name,
    quantity: i.quantity,
    status: i.status,
    last_bought_at: i.lastBoughtAt ?? null,
    times_bought: i.timesBought,
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
  updated_at: string
  deleted: boolean
  synced_at: string
}

export const fixedExpensesTable: SyncedTable<FixedExpense, FixedExpenseRow> = {
  name: 'fixed_expenses',
  local: db.fixedExpenses,
  columns: 'id, name, category, amount, payment_method, currency, updated_at, deleted, synced_at',
  toRow: (f) => ({
    id: f.id,
    name: f.name,
    category: f.category,
    amount: f.amount,
    payment_method: f.paymentMethod ?? 'cash',
    currency: f.currency ?? 'ARS',
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
    updatedAt: row.updated_at,
    deleted: row.deleted,
    pending: 0,
  }),
}

interface CardStatementRow {
  id: string
  paid_at: string
  updated_at: string
  deleted: boolean
  synced_at: string
}

export const cardStatementsTable: SyncedTable<CardStatement, CardStatementRow> = {
  name: 'card_statements',
  local: db.cardStatements,
  columns: 'id, paid_at, updated_at, deleted, synced_at',
  onConflict: 'user_id,id', // composite primary key; user_id comes from auth.uid()
  toRow: (c) => ({ id: c.id, paid_at: c.paidAt, updated_at: c.updatedAt, deleted: c.deleted }),
  fromRow: (row) => ({
    id: row.id,
    paidAt: row.paid_at,
    updatedAt: row.updated_at,
    deleted: row.deleted,
    pending: 0,
  }),
}

interface ProfileRow {
  id: string
  name: string | null
  monthly_income: number | string | null
  updated_at: string
  deleted: boolean
  synced_at: string
}

export const profileTable: SyncedTable<Profile, ProfileRow> = {
  name: 'profiles',
  local: db.profile,
  columns: 'id, name, monthly_income, updated_at, deleted, synced_at',
  onConflict: 'user_id,id', // composite primary key; user_id comes from auth.uid()
  toRow: (p) => ({
    id: p.id,
    name: p.name ?? null,
    monthly_income: p.monthlyIncome ?? null,
    updated_at: p.updatedAt,
    deleted: p.deleted,
  }),
  fromRow: (row) => ({
    id: row.id,
    name: row.name ?? undefined,
    monthlyIncome: row.monthly_income === null ? undefined : Number(row.monthly_income),
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
  toSyncTask(fixedExpensesTable),
  toSyncTask(cardStatementsTable),
  toSyncTask(profileTable),
]
