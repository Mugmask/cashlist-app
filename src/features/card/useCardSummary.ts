import { useLiveQuery } from 'dexie-react-hooks'
import { getExpensesSince, MAX_INSTALLMENTS } from '@/features/expenses'
import { shiftMonth } from '@/utils/dates'
import { cardRepo } from './cardRepo'
import { buildCardSummary } from './summary'

// A month's card statements; undefined while loading. The expenses that can still charge them
// (as far back as the longest installment plan) plus the paid statements, in one live query,
// so marking a statement or adding a card expense updates it at once.
export function useCardSummary(month: Date) {
  return useLiveQuery(async () => {
    const [expenses, statements] = await Promise.all([
      getExpensesSince(shiftMonth(month, -MAX_INSTALLMENTS)),
      cardRepo.all(),
    ])
    return buildCardSummary(expenses, statements, month)
  }, [month.getTime()])
}
