import { chargedAfter, chargeOn } from '@/features/expenses'
import type { Expense } from '@/lib/db'
import { toPeriod } from '@/utils/dates'

export interface CardSummary {
  // This month's statement so far, paid next month: this month's purchases (their 1st
  // installment) plus the installments of earlier ones that fall on it
  current: { period: string; total: number; count: number }
  // Installments still to come after this month's statement
  upcoming: number
}

export function isCard(expense: Expense) {
  return expense.paymentMethod === 'card'
}

// Card statements by calendar month: what's charged in September is paid in October.
// `expenses` must reach back as far as the longest installment plan.
export function buildCardSummary(expenses: readonly Expense[], now: Date): CardSummary {
  const currentPeriod = toPeriod(now)

  let currentTotal = 0
  let currentCount = 0
  let upcoming = 0
  for (const e of expenses) {
    if (e.deleted || !isCard(e)) continue
    const current = chargeOn(e, currentPeriod)
    if (current > 0) {
      currentTotal += current
      currentCount += 1
    }
    upcoming += chargedAfter(e, currentPeriod)
  }

  return {
    current: { period: currentPeriod, total: round(currentTotal), count: currentCount },
    upcoming: round(upcoming),
  }
}

// Sums of cents in floating point drift (0.1 + 0.2); amounts are kept to the cent
function round(amount: number) {
  return Math.round(amount * 100) / 100
}
