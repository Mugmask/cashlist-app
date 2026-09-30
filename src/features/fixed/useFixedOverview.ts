import { useLiveQuery } from 'dexie-react-hooks'
import { getFixedPayments } from '@/features/expenses'
import { toPeriod } from '@/utils/dates'
import { fixedRepo } from './fixedRepo'
import { buildFixedOverview } from './overview'

// undefined while loading. Fixed expenses and this month's payments come from one live
// query, so paying (or undoing) updates everything at once.
export function useFixedOverview() {
  return useLiveQuery(async () => {
    const today = new Date()
    const period = toPeriod(today)
    const [fixed, payments] = await Promise.all([fixedRepo.active(), getFixedPayments(period)])
    return { today, period, ...buildFixedOverview(fixed, payments, today) }
  })
}
