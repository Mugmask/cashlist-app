import { getExpensesSince, MAX_INSTALLMENTS } from '@/features/expenses'
import { useKeyedLiveQuery } from '@/lib/useKeyedLiveQuery'
import { shiftMonth } from '@/utils/dates'
import { buildCardSummary } from './summary'

export type CardSummary = NonNullable<ReturnType<typeof useCardSummary>>

// A month's card statement; undefined while loading. From the expenses that can still charge
// it (as far back as the longest installment plan), in a live query, so adding a card
// expense updates it at once.
export function useCardSummary(month: Date) {
  return useKeyedLiveQuery(async () => {
    const expenses = await getExpensesSince(shiftMonth(month, -MAX_INSTALLMENTS))
    return buildCardSummary(expenses, month)
  }, month.getTime())
}
