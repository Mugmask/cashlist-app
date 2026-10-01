import { useLiveQuery } from 'dexie-react-hooks'
import { getMonthExpenses } from './expensesRepo'
import { summarizeMonth } from './selectors'

// A month's expenses and totals; undefined while loading. "Now" is read inside the query, not
// during render, and the query re-runs whenever the local database changes.
export function useMonthExpenses(month: Date) {
  return useLiveQuery(async () => {
    const expenses = await getMonthExpenses(month)
    return { expenses, ...summarizeMonth(expenses, month, new Date()) }
  }, [month.getTime()])
}
