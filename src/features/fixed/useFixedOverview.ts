import { getFixedInUseBy, getFixedPayments } from '@/features/expenses'
import { useDollarRate } from '@/lib/useDollarRate'
import { useKeyedLiveQuery } from '@/lib/useKeyedLiveQuery'
import { toPeriod } from '@/utils/dates'
import { fixedRepo } from './fixedRepo'
import { buildFixedOverview, fixedForPeriod } from './overview'

export type FixedOverview = NonNullable<ReturnType<typeof useFixedOverview>>

// A month's fixed expenses; undefined while loading. Fixed expenses and that month's payments
// come from one live query, so paying (or undoing) updates everything at once. A month gone
// shows the fixed expenses of then, not today's (see fixedForPeriod). Today's dollar
// rates are fetched only when there are dollar fixed expenses, to estimate them in pesos.
export function useFixedOverview(month: Date) {
  const period = toPeriod(month)
  const data = useKeyedLiveQuery(async () => {
    const [all, payments, inUse] = await Promise.all([
      fixedRepo.all(),
      getFixedPayments(period),
      getFixedInUseBy(period),
    ])
    // Read with the data: due dates count from it (it moves on with the next change or visit)
    const today = new Date()
    const gone = period < toPeriod(today)
    return { fixed: fixedForPeriod(all, payments, inUse, gone), payments, today }
  }, period)

  const dollars = data?.fixed.filter((f) => f.currency === 'USD') ?? []
  const card = useDollarRate(dollars.some((f) => f.paymentMethod === 'card') ? 'tarjeta' : null)
  const blue = useDollarRate(dollars.some((f) => f.paymentMethod !== 'card') ? 'blue' : null)

  if (!data) return undefined
  const rates = { tarjeta: card.estimate?.rate, blue: blue.estimate?.rate }
  return {
    period,
    ...buildFixedOverview(data.fixed, data.payments, rates, { period, today: data.today }),
  }
}
