import { useLiveQuery } from 'dexie-react-hooks'
import { startOfMonth } from '@/utils/dates'
import { expensesRepo } from './expensesRepo'
import { summarizeMonth } from './selectors'

// undefined while loading. "Now" is read inside the query, not during render, and the query
// re-runs whenever the local database changes.
export function useMonthExpenses() {
  return useLiveQuery(async () => {
    const now = new Date()
    const expenses = await expensesRepo.since(startOfMonth(now))
    return { expenses, ...summarizeMonth(expenses, now) }
  })
}
