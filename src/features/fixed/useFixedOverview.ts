import { useLiveQuery } from 'dexie-react-hooks'
import { getFixedPayments } from '@/features/expenses'
import { useDollarRate } from '@/lib/useDollarRate'
import { toPeriod } from '@/utils/dates'
import { fixedRepo } from './fixedRepo'
import { buildFixedOverview } from './overview'

// undefined while loading. Fixed expenses and this month's payments come from one live
// query, so paying (or undoing) updates everything at once. Today's dollar rates are fetched
// only when there are dollar fixed expenses, to estimate them in pesos.
export function useFixedOverview() {
  const data = useLiveQuery(async () => {
    const today = new Date()
    const period = toPeriod(today)
    const [fixed, payments] = await Promise.all([fixedRepo.active(), getFixedPayments(period)])
    return { today, period, fixed, payments }
  })

  const dollars = data?.fixed.filter((f) => f.currency === 'USD') ?? []
  const card = useDollarRate(dollars.some((f) => f.paymentMethod === 'card') ? 'tarjeta' : null)
  const blue = useDollarRate(dollars.some((f) => f.paymentMethod !== 'card') ? 'blue' : null)

  if (!data) return undefined
  const { today, period, fixed, payments } = data
  const rates = { tarjeta: card.rate?.rate, blue: blue.rate?.rate }
  return { today, period, ...buildFixedOverview(fixed, payments, rates) }
}
