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
export function splitInstallments(total: number, count: number): number[] {
  const each = Math.floor((total / count) * 100) / 100
  const last = Math.round((total - each * (count - 1)) * 100) / 100
  return [...Array.from({ length: count - 1 }, () => each), last]
}

// What a card statement charges for this expense. A statement is named after the month whose
// purchases it closes ("2026-09", paid in October): it charges the 1st installment of that
// month's purchases, the 2nd of the month before's, and so on.
export function chargeOn(expense: Expense, statementPeriod: string) {
  const index = monthsBetween(toPeriod(new Date(expense.spentAt)), statementPeriod)
  const parts = splitInstallments(expense.amount, installmentsOf(expense))
  return index >= 0 && index < parts.length ? parts[index] : 0
}

// What's still to be charged after the statement of `period`: the installments left
export function chargedAfter(expense: Expense, period: string) {
  const index = monthsBetween(toPeriod(new Date(expense.spentAt)), period)
  const parts = splitInstallments(expense.amount, installmentsOf(expense))
  return parts.slice(Math.max(index + 1, 0)).reduce((sum, p) => sum + p, 0)
}
