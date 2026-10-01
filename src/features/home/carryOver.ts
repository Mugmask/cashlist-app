import { forMonth, isFixed } from '@/features/expenses'
import type { Expense, Income } from '@/lib/db'
import { fromPeriod, monthsBetween, shiftMonth, toPeriod } from '@/utils/dates'

// What the months before `period` left over (or overspent), added up: each one is the monthly
// income plus the other incomes received in it, minus what it counted (installments in their own month, as everywhere). Computed from the
// expenses, never stored, so fixing an old expense fixes every month after it.
//
// It starts on the first month with a fixed expense paid: the first one kept whole in the app.
// Earlier months only hold card purchases loaded for their installments, and would count as
// a whole income left over.
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
  const tracked = before.filter(isFixed).map((e) => toPeriod(new Date(e.spentAt)))
  if (tracked.length === 0) return null
  const from = tracked.reduce((first, p) => (p < first ? p : first))

  let cents = 0
  for (let i = 0; i < monthsBetween(from, period); i++) {
    const month = toPeriod(shiftMonth(fromPeriod(from), i))
    const spent = before.reduce((sum, e) => sum + (forMonth(e, month)?.amount ?? 0), 0)
    const received = incomes
      .filter((i) => toPeriod(new Date(i.receivedAt)) === month)
      .reduce((sum, i) => sum + i.amount, 0)
    cents += Math.round((income + received - spent) * 100)
  }
  return { amount: cents / 100, from, to: toPeriod(shiftMonth(fromPeriod(period), -1)) }
}
