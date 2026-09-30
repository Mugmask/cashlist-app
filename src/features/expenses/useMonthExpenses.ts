import { useLiveQuery } from 'dexie-react-hooks'
import { startOfMonth } from '@/utils/dates'
import { expensesRepo } from './expensesRepo'

// expenses is undefined while loading; re-renders whenever the local database changes
export function useMonthExpenses() {
  const from = startOfMonth()
  const expenses = useLiveQuery(() => expensesRepo.since(from), [from.getTime()])
  const total = expenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0
  return { expenses, total }
}
