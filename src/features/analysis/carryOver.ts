import { firstTrackedPeriod, installmentsOf, splitInstallments } from '@/features/expenses'
import type { Expense, Income } from '@/lib/db'
import { fromPeriod, monthsBetween, shiftMonth, toPeriod } from '@/utils/dates'

// What an expense takes from each month ("2026-09"). The balance passes its own (by cash: a
// card purchase the month its statement is due); this one is by purchase, each installment
// in its own month from the one it was bought.
export type PartsOf = (expense: Expense) => readonly { period: string; amount: number }[]

export const partsByPurchase: PartsOf = (e) => {
  const start = fromPeriod(toPeriod(new Date(e.spentAt)))
  const count = installmentsOf(e)
  const parts = count === 1 ? [e.amount] : splitInstallments(e.amount, count)
  return parts.map((amount, i) => ({ period: toPeriod(shiftMonth(start, i)), amount }))
}

// What the months before `period` left over (or overspent), added up: each one is the monthly
// income plus the other incomes received in it, minus what it took (see PartsOf). Computed
// from the expenses, never stored, so fixing an old expense fixes every month after it.
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
  partsOf: PartsOf = partsByPurchase,
): CarryOver | null {
  const before = expenses.filter((e) => monthsBetween(toPeriod(new Date(e.spentAt)), period) > 0)
  const from = firstTrackedPeriod(before)
  if (from === undefined) return null

  // One pass over the expenses and one over the incomes, each adding its cents to the months
  // it counts in (an installment purchase, to each month of its plan), instead of going
  // through every expense once per month: it stays quick with years of history.
  const months = monthsBetween(from, period)
  const net = new Array<number>(months).fill(Math.round(income * 100))
  const add = (p: string, cents: number) => {
    const month = monthsBetween(from, p)
    if (month >= 0 && month < months) net[month] += cents
  }
  for (const e of before) {
    for (const part of partsOf(e)) add(part.period, -Math.round(part.amount * 100))
  }
  for (const i of incomes) add(toPeriod(new Date(i.receivedAt)), Math.round(i.amount * 100))

  const cents = net.reduce((sum, month) => sum + month, 0)
  return { amount: cents / 100, from, to: toPeriod(shiftMonth(fromPeriod(period), -1)) }
}
