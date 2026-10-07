import { getExpensesSince, MAX_INSTALLMENTS } from '@/features/expenses'
import { useKeyedLiveQuery } from '@/lib/useKeyedLiveQuery'
import { shiftMonth, toPeriod } from '@/utils/dates'
import { cardsRepo } from './cardsRepo'
import { buildSchedules } from './cycles'
import { cardStatuses, referenceDay } from './summary'

export type CardSummary = NonNullable<ReturnType<typeof useCardSummary>>

// Each card's statement in progress as seen from `month` (today in the current one), and what's
// on the ones after it; undefined while loading. From the expenses that can still be charged
// on it (as far back as the longest installment plan), in a live query, so adding a card
// expense updates it at once.
export function useCardSummary(month: Date) {
  return useKeyedLiveQuery(async () => {
    const [expenses, { cards, cycles }] = await Promise.all([
      getExpensesSince(shiftMonth(month, -MAX_INSTALLMENTS - 1)),
      cardsRepo.all(),
    ])
    const day = referenceDay(toPeriod(month), new Date())
    return cardStatuses(expenses, day, cards, buildSchedules(cycles))
  }, month.getTime())
}
