import { getExpensesBefore, useMonthExpenses } from '@/features/expenses'
import { useFixedOverview } from '@/features/fixed'
import { getIncomesBefore, useMonthIncomes } from '@/features/incomes'
import { useMonth } from '@/features/month'
import { useProfile } from '@/features/profile'
import { useKeyedLiveQuery } from '@/lib/useKeyedLiveQuery'
import { toPeriod } from '@/utils/dates'
import { monthBalance } from './monthBalance'

// `month`'s balance (see monthBalance), kept up to date; undefined while loading
export function useMonthBalance(month: Date) {
  const { current } = useMonth()
  const expenses = useMonthExpenses(month)
  const incomes = useMonthIncomes(month)
  const profile = useProfile()
  const fixed = useFixedOverview(month)
  // Everything before the month, for what it carries over
  const earlier = useKeyedLiveQuery(
    async () => ({
      expenses: await getExpensesBefore(month),
      incomes: await getIncomesBefore(month),
    }),
    month.getTime(),
  )

  if (!expenses || !incomes || !fixed || !earlier || profile === undefined) return undefined
  const isCurrent = month.getTime() === current.getTime()
  return monthBalance({
    period: toPeriod(month),
    monthlyIncome: profile?.monthlyIncome,
    received: incomes.total,
    spent: expenses.total,
    committed: isCurrent ? fixed.totals.remaining : 0,
    earlier,
  })
}
