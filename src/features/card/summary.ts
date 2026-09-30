import type { CardStatement, Expense } from '@/lib/db'
import { shiftMonth, toPeriod } from '@/utils/dates'

export interface CardSummary {
  // This month's card spending: it will be paid next month
  current: { period: string; total: number; count: number }
  // Last month's statement, due now. Null when nothing was charged to the card.
  previous: { period: string; total: number; paid: boolean } | null
}

export function isCard(expense: Expense) {
  return expense.paymentMethod === 'card'
}

// Card spending by statement, with calendar months: what's spent in September is paid in
// October. `expenses` must cover at least last month and this one.
export function buildCardSummary(
  expenses: readonly Expense[],
  statements: readonly CardStatement[],
  now: Date,
): CardSummary {
  const currentPeriod = toPeriod(now)
  const previousPeriod = toPeriod(shiftMonth(now, -1))

  let currentTotal = 0
  let currentCount = 0
  let previousTotal = 0
  for (const e of expenses) {
    if (e.deleted || !isCard(e)) continue
    const period = toPeriod(new Date(e.spentAt))
    if (period === currentPeriod) {
      currentTotal += e.amount
      currentCount += 1
    } else if (period === previousPeriod) {
      previousTotal += e.amount
    }
  }

  const paid = statements.some((s) => s.id === previousPeriod && !s.deleted)

  return {
    current: { period: currentPeriod, total: currentTotal, count: currentCount },
    previous: previousTotal > 0 ? { period: previousPeriod, total: previousTotal, paid } : null,
  }
}
