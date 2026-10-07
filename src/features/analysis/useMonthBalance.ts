import { getCashBasis } from '@/features/card'
import { getExpensesBefore, getExpensesSince, MAX_INSTALLMENTS } from '@/features/expenses'
import { useFixedOverview } from '@/features/fixed'
import { getIncomesBefore, useMonthIncomes } from '@/features/incomes'
import { useMonth } from '@/features/month'
import { useProfile } from '@/features/profile'
import { useKeyedLiveQuery } from '@/lib/useKeyedLiveQuery'
import { shiftMonth, toPeriod } from '@/utils/dates'
import { monthBalance } from './monthBalance'

// `month`'s balance (see monthBalance), kept up to date; undefined while loading. Counted by
// cash: what left the month's money, a card purchase when its statement is due (see cashParts),
// since the card is paid with the next month's income.
export function useMonthBalance(month: Date) {
  const { current } = useMonth()
  const incomes = useMonthIncomes(month)
  const profile = useProfile()
  const fixed = useFixedOverview(month)
  const period = toPeriod(month)
  const data = useKeyedLiveQuery(async () => {
    const [cash, recent, expenses, incomes] = await Promise.all([
      getCashBasis(),
      // Far enough back for the longest installment plan, and a month more: a purchase late in
      // a month is due the next one
      getExpensesSince(shiftMonth(month, -MAX_INSTALLMENTS - 1)),
      // Everything before the month, for what it carries over
      getExpensesBefore(month),
      getIncomesBefore(month),
    ])
    return {
      payments: cash.paymentsIn(recent, period),
      partsOf: cash.partsOf,
      earlier: { expenses, incomes },
    }
  }, month.getTime())

  if (!incomes || !fixed || !data || profile === undefined) return undefined
  const isCurrent = month.getTime() === current.getTime()
  // A fixed expense paid by card this month is due on next month's statement: it doesn't take
  // from this month's money
  const committed = fixed.pending
    .filter((line) => line.fixed.paymentMethod !== 'card')
    .reduce((sum, line) => sum + line.amount, 0)
  return monthBalance({
    period,
    monthlyIncome: profile?.monthlyIncome,
    received: incomes.total,
    spent: data.payments.total,
    committed: isCurrent ? committed : 0,
    earlier: data.earlier,
    partsOf: data.partsOf,
    payments: data.payments,
  })
}
