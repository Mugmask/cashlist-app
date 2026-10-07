import type { Expense } from '@/lib/db'
import { monthsBetween, toPeriod } from '@/utils/dates'

// Installment plans offered when paying by card ("1" is a single payment)
export const INSTALLMENT_OPTIONS = ['1', '2', '3', '6', '9', '12'] as const
export const MAX_INSTALLMENTS = 12

// How many payments an expense is split into: 1 unless it's a card purchase in installments
export function installmentsOf(expense: Pick<Expense, 'installments'>) {
  return expense.installments ?? 1
}

// The total split into `count` installments, in cents; the last one absorbs the rounding so
// they always add up to the total: 100 in 3 → 33.33, 33.33, 33.34
// Whole cents throughout: (12289.08 / 12) * 100 lands a hair under 102409 in floating point,
// and flooring that gave 1024.08 eleven times and 1024.20 last, not 1024.09 twelve times.
export function splitInstallments(total: number, count: number): number[] {
  const cents = Math.round(total * 100)
  const each = Math.floor(cents / count)
  const last = cents - each * (count - 1)
  return [...Array.from({ length: count - 1 }, () => each / 100), last / 100]
}

// An expense as one month sees it. A purchase in installments counts one installment a month,
// from the month it was bought: `amount` is that month's installment, and `installment` says
// which one it is. Anything else is the expense as is, in its own month.
export type MonthExpense = Expense & {
  installment?: { number: number; count: number; total: number }
}

// This expense's part of `period` ("2026-09"), or null when nothing of it falls there
export function forMonth(expense: Expense, period: string): MonthExpense | null {
  const index = monthsBetween(toPeriod(new Date(expense.spentAt)), period)
  const count = installmentsOf(expense)
  if (index < 0 || index >= count) return null
  if (count === 1) return expense
  return {
    ...expense,
    amount: splitInstallments(expense.amount, count)[index],
    installment: { number: index + 1, count, total: expense.amount },
  }
}
