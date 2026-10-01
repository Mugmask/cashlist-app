import { firstTrackedPeriod, installmentsOf, splitInstallments } from '@/features/expenses'
import type { Expense, Income } from '@/lib/db'
import { fromPeriod, monthsBetween, shiftMonth, toPeriod } from '@/utils/dates'

// What the months before `period` left over (or overspent), added up: each one is the monthly
// income plus the other incomes received in it, minus what it counted (installments in their own month, as everywhere). Computed from the
// expenses, never stored, so fixing an old expense fixes every month after it.
//
// It starts on the first month kept whole in the app (see firstTrackedPeriod): earlier months
// only hold card purchases loaded for their installments, and would count as a whole income
// left over.
export interface CarryOver {
  amount: number // positive: left over; negative: overspent
  from: string // first month it includes ("2026-09")
  to: string // last month it includes, the one before `period`
}

export function carryOver(
  expenses: readonly Expense[],
  income: number,
  period: string,
  incomes: readonly Income[] = [],
): CarryOver | null {
  const before = expenses.filter((e) => monthsBetween(toPeriod(new Date(e.spentAt)), period) > 0)
  const from = firstTrackedPeriod(before)
  if (from === undefined) return null

  // One pass over the expenses and one over the incomes, each adding its cents to the months
  // it counts in (an installment purchase, to each month of its plan), instead of going
  // through every expense once per month: it stays quick with years of history.
  const months = monthsBetween(from, period)
  const net = new Array<number>(months).fill(Math.round(income * 100))
  const add = (date: string, offset: number, cents: number) => {
    const month = monthsBetween(from, toPeriod(new Date(date))) + offset
    if (month >= 0 && month < months) net[month] += cents
  }
  for (const e of before) {
    const count = installmentsOf(e)
    const parts = count === 1 ? [e.amount] : splitInstallments(e.amount, count)
    parts.forEach((part, i) => add(e.spentAt, i, -Math.round(part * 100)))
  }
  for (const i of incomes) add(i.receivedAt, 0, Math.round(i.amount * 100))

  const cents = net.reduce((sum, month) => sum + month, 0)
  return { amount: cents / 100, from, to: toPeriod(shiftMonth(fromPeriod(period), -1)) }
}
