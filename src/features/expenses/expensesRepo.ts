import { db, type ExchangeRateKind, type Expense, type PaymentMethod } from '@/lib/db'
import { shiftMonth, toPeriod } from '@/utils/dates'
import { forMonth, MAX_INSTALLMENTS, type MonthExpense } from './installments'

// What can be corrected on an existing expense. `name: undefined` / `note: undefined` clear them.
export type ExpenseChanges = Partial<
  Pick<
    Expense,
    | 'amount'
    | 'category'
    | 'name'
    | 'note'
    | 'paymentMethod'
    | 'spentAt'
    | 'currency'
    | 'foreignAmount'
    | 'exchangeRate'
    | 'exchangeRateKind'
    | 'installments'
  >
>

export interface NewExpense {
  amount: number
  category: string // an ExpenseCategoryId; unknown ids show as "Otros"
  name?: string // "Nafta", "Alquiler"
  note?: string
  paymentMethod?: PaymentMethod // cash when missing
  // Only for an expense in dollars (then `amount` is the pesos it came to)
  currency?: 'USD'
  foreignAmount?: number
  exchangeRate?: number
  exchangeRateKind?: ExchangeRateKind
  installments?: number // a card purchase in installments (2 or more)
  // Only for the payment of a fixed expense
  fixedExpenseId?: string
  fixedPeriod?: string
  spentAt?: string // ISO; now when missing (loaded the moment it happened)
}

// A month's expenses, newest first: the ones made in it, plus the installments of earlier
// purchases that fall on it (see forMonth: an installment counts in its own month). Meant to be
// called inside a live query (it reads the database), so other features can combine it with
// their own data in a single query.
export async function getMonthExpenses(month: Date): Promise<MonthExpense[]> {
  const period = toPeriod(month)
  // Far enough back for the longest installment plan to still reach this month
  const candidates = await expensesRepo.between(
    shiftMonth(month, 1 - MAX_INSTALLMENTS),
    shiftMonth(month, 1),
  )
  return candidates.flatMap((e) => forMonth(e, period) ?? [])
}

// Non-deleted expenses before a date, newest first: every month already gone. For live queries.
export function getExpensesBefore(date: Date) {
  return expensesRepo.between(new Date(0), date)
}

// Non-deleted expenses since a date, newest first. For live queries in other features.
export function getExpensesSince(date: Date) {
  return expensesRepo.since(date)
}

// Every payment of one fixed expense, the latest month first
export async function getPaymentsOf(fixedExpenseId: string) {
  const payments = await db.expenses
    .filter((e) => e.fixedExpenseId === fixedExpenseId && !e.deleted)
    .toArray()
  return payments.sort((a, b) => (b.fixedPeriod ?? '').localeCompare(a.fixedPeriod ?? ''))
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
      spentAt: data.spentAt ?? iso,
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

  // Non-deleted expenses from `start` up to (not including) `end`, newest first
  between(start: Date, end: Date) {
    return db.expenses
      .where('spentAt')
      .between(start.toISOString(), end.toISOString(), true, false)
      .reverse()
      .filter((e) => !e.deleted)
      .toArray()
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
