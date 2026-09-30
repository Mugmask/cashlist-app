import { db, type Budget, type Expense } from '@/lib/db'
import { toSyncTask, type SyncedTable } from './engine'

interface ExpenseRow {
  id: string
  amount: number | string // numeric can come back as a string
  category: string
  spent_at: string
  note: string | null
  updated_at: string
  deleted: boolean
  synced_at: string
}

export const expensesTable: SyncedTable<Expense, ExpenseRow> = {
  name: 'expenses',
  local: db.expenses,
  columns: 'id, amount, category, spent_at, note, updated_at, deleted, synced_at',
  toRow: (e) => ({
    id: e.id,
    amount: e.amount,
    category: e.category,
    spent_at: e.spentAt,
    note: e.note ?? null,
    updated_at: e.updatedAt,
    deleted: e.deleted,
  }),
  fromRow: (row) => ({
    id: row.id,
    amount: Number(row.amount),
    category: row.category,
    spentAt: row.spent_at,
    note: row.note ?? undefined,
    updatedAt: row.updated_at,
    deleted: row.deleted,
    pending: 0,
  }),
}

interface BudgetRow {
  id: string
  amount: number | string
  updated_at: string
  deleted: boolean
  synced_at: string
}

export const budgetsTable: SyncedTable<Budget, BudgetRow> = {
  name: 'budgets',
  local: db.budgets,
  columns: 'id, amount, updated_at, deleted, synced_at',
  onConflict: 'user_id,id', // composite primary key; user_id comes from auth.uid()
  toRow: (b) => ({
    id: b.id,
    amount: b.amount,
    updated_at: b.updatedAt,
    deleted: b.deleted,
  }),
  fromRow: (row) => ({
    id: row.id,
    amount: Number(row.amount),
    updatedAt: row.updated_at,
    deleted: row.deleted,
    pending: 0,
  }),
}

// Every synced table; each one syncs independently of the others
export const SYNCED_TABLES = [toSyncTask(expensesTable), toSyncTask(budgetsTable)]
