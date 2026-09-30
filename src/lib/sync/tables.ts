import {
  db,
  type CardStatement,
  type Expense,
  type FixedExpense,
  type PaymentMethod,
  type ShoppingItem,
  type ShoppingItemStatus,
} from '@/lib/db'
import { toSyncTask, type SyncedTable } from './engine'

interface ExpenseRow {
  id: string
  amount: number | string // numeric can come back as a string
  category: string
  spent_at: string
  note: string | null
  fixed_expense_id: string | null
  fixed_period: string | null
  payment_method: PaymentMethod
  updated_at: string
  deleted: boolean
  synced_at: string
}

export const expensesTable: SyncedTable<Expense, ExpenseRow> = {
  name: 'expenses',
  local: db.expenses,
  columns:
    'id, amount, category, spent_at, note, fixed_expense_id, fixed_period, payment_method, updated_at, deleted, synced_at',
  toRow: (e) => ({
    id: e.id,
    amount: e.amount,
    category: e.category,
    spent_at: e.spentAt,
    note: e.note ?? null,
    fixed_expense_id: e.fixedExpenseId ?? null,
    fixed_period: e.fixedPeriod ?? null,
    payment_method: e.paymentMethod ?? 'cash',
    updated_at: e.updatedAt,
    deleted: e.deleted,
  }),
  fromRow: (row) => ({
    id: row.id,
    amount: Number(row.amount),
    category: row.category,
    spentAt: row.spent_at,
    note: row.note ?? undefined,
    fixedExpenseId: row.fixed_expense_id ?? undefined,
    fixedPeriod: row.fixed_period ?? undefined,
    paymentMethod: row.payment_method,
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
  due_day: number | null
  payment_method: PaymentMethod
  updated_at: string
  deleted: boolean
  synced_at: string
}

export const fixedExpensesTable: SyncedTable<FixedExpense, FixedExpenseRow> = {
  name: 'fixed_expenses',
  local: db.fixedExpenses,
  columns: 'id, name, category, amount, due_day, payment_method, updated_at, deleted, synced_at',
  toRow: (f) => ({
    id: f.id,
    name: f.name,
    category: f.category,
    amount: f.amount,
    due_day: f.dueDay ?? null,
    payment_method: f.paymentMethod ?? 'cash',
    updated_at: f.updatedAt,
    deleted: f.deleted,
  }),
  fromRow: (row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    amount: Number(row.amount),
    dueDay: row.due_day ?? undefined,
    paymentMethod: row.payment_method,
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

// Every synced table; each one syncs independently of the others
export const SYNCED_TABLES = [
  toSyncTask(expensesTable),
  toSyncTask(shoppingItemsTable),
  toSyncTask(fixedExpensesTable),
  toSyncTask(cardStatementsTable),
]
