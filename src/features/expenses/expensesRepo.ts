import { db, type ExchangeRateKind, type Expense, type PaymentMethod } from '@/lib/db'
import { startOfMonth } from '@/utils/dates'

// What can be corrected on an existing expense. `note: undefined` clears it.
export type ExpenseChanges = Partial<
  Pick<
    Expense,
    | 'amount'
    | 'category'
    | 'note'
    | 'paymentMethod'
    | 'spentAt'
    | 'currency'
    | 'foreignAmount'
    | 'exchangeRate'
    | 'exchangeRateKind'
  >
>

export interface NewExpense {
  amount: number
  category: string // an ExpenseCategoryId; unknown ids show as "Otros"
  note?: string
  paymentMethod?: PaymentMethod // cash when missing
  // Only for an expense in dollars (then `amount` is the pesos it came to)
  currency?: 'USD'
  foreignAmount?: number
  exchangeRate?: number
  exchangeRateKind?: ExchangeRateKind
  // Only for the payment of a fixed expense
  fixedExpenseId?: string
  fixedPeriod?: string
}

// This month's expenses. Meant to be called inside a live query (it reads the database),
// so other features can combine it with their own data in a single query.
export function getMonthExpenses(now: Date) {
  return expensesRepo.since(startOfMonth(now))
}

// Non-deleted expenses since a date, newest first. For live queries in other features.
export function getExpensesSince(date: Date) {
  return expensesRepo.since(date)
}

// Payments of fixed expenses for a month ("2026-09"), whenever they were paid
export function getFixedPayments(period: string) {
  return db.expenses
    .where('fixedPeriod')
    .equals(period)
    .filter((e) => !e.deleted)
    .toArray()
}

// For other features that record or undo an expense (a purchase, a fixed payment)
export function addExpense(data: NewExpense) {
  return expensesRepo.add(data)
}

export function removeExpense(id: string) {
  return expensesRepo.remove(id)
}

// Single entry point to local expenses: components never touch Dexie directly
export const expensesRepo = {
  async add(data: NewExpense, now = new Date()) {
    const iso = now.toISOString()
    const id = crypto.randomUUID()
    const expense: Expense = {
      ...data,
      id,
      spentAt: iso,
      updatedAt: iso,
      deleted: false,
      pending: 1,
    }
    await db.expenses.add(expense)
    return id
  },

  async update(id: string, changes: ExpenseChanges, now = new Date()) {
    await db.expenses.update(id, {
      ...changes,
      updatedAt: now.toISOString(),
      pending: 1,
    })
  },

  // One expense, deleted or not (undefined if it doesn't exist). For live queries.
  get(id: string) {
    return db.expenses.get(id)
  },

  async remove(id: string, now = new Date()) {
    await db.expenses.update(id, {
      deleted: true,
      updatedAt: now.toISOString(),
      pending: 1,
    })
  },

  // Non-deleted expenses since a date, newest first
  since(date: Date) {
    return db.expenses
      .where('spentAt')
      .aboveOrEqual(date.toISOString())
      .reverse()
      .filter((e) => !e.deleted)
      .toArray()
  },
}
