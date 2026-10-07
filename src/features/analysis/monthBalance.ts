import type { MonthPayments } from '@/features/card'
import type { Expense, Income } from '@/lib/db'
import { carryOver, type CarryOver, type PartsOf } from './carryOver'

// A month's money, the one answer every screen gives: what it has to spend, what went, and
// what's spoken for. Home's balance and Analysis' per day both read it, so they never disagree.
export interface MonthBalance {
  // The monthly income plus whatever else came in; undefined with neither (nothing to measure
  // against)
  income?: number
  // What the months before left over or overspent. Only with a monthly income: without one,
  // every month before would look overspent by all it spent.
  carry: CarryOver | null
  // What the month has: income plus the carry. Undefined without an income.
  available?: number
  spent: number // everything counted in the month
  committed: number // fixed expenses still to pay; this month only, a month gone owes nothing
  // What `spent` is made of when counted by cash: cash and debit, and each card's statement
  payments?: MonthPayments
}

export function monthBalance({
  period,
  monthlyIncome,
  received,
  spent,
  committed,
  earlier,
  partsOf,
  payments,
}: {
  period: string // "2026-10"
  monthlyIncome?: number // the profile's
  received: number // other incomes of the month
  spent: number
  committed: number
  earlier: { expenses: readonly Expense[]; incomes: readonly Income[] } // before the month
  partsOf?: PartsOf // what each expense takes from each month; by purchase when missing
  payments?: MonthPayments
}): MonthBalance {
  const income =
    monthlyIncome !== undefined || received > 0 ? (monthlyIncome ?? 0) + received : undefined
  const carry =
    monthlyIncome !== undefined
      ? carryOver(earlier.expenses, monthlyIncome, period, earlier.incomes, partsOf)
      : null
  return {
    income,
    carry,
    available: income === undefined ? undefined : income + (carry?.amount ?? 0),
    spent,
    committed,
    ...(payments && { payments }),
  }
}
