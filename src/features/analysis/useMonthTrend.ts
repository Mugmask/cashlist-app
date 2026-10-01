import { useLiveQuery } from 'dexie-react-hooks'
import { getMonthExpenses, summarizeMonth } from '@/features/expenses'
import { shiftMonth } from '@/utils/dates'

export interface MonthPoint {
  month: Date
  total: number
  fixedTotal: number
  variableTotal: number
}

// The totals of the `count` months ending at `month`, oldest first; undefined while loading
export function useMonthTrend(month: Date, count = 6) {
  return useLiveQuery(async () => {
    const months = Array.from({ length: count }, (_, i) => shiftMonth(month, i - count + 1))
    return Promise.all(
      months.map(async (m): Promise<MonthPoint> => {
        const { total, fixedTotal, variableTotal } = summarizeMonth(await getMonthExpenses(m))
        return { month: m, total, fixedTotal, variableTotal }
      }),
    )
  }, [month.getTime(), count])
}
