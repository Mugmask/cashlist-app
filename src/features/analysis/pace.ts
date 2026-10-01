import type { MonthExpense } from '@/features/expenses'
import { daysInMonth, toPeriod } from '@/utils/dates'

// What was spent in `month` by the end of each of its days: index 0 is the 1st. Installments
// of earlier purchases fall on the 1st, when the month starts owing them. In cents while
// adding, so it never drifts.
export function cumulativeByDay(expenses: readonly MonthExpense[], month: Date): number[] {
  const days = daysInMonth(month)
  const period = toPeriod(month)
  const perDay = new Array<number>(days).fill(0)
  for (const e of expenses) {
    const date = new Date(e.spentAt)
    const day = toPeriod(date) === period ? date.getDate() : 1
    perDay[Math.min(day, days) - 1] += Math.round(e.amount * 100)
  }
  let cents = 0
  return perDay.map((d) => (cents += d) / 100)
}
