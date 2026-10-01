import { useLiveQuery } from 'dexie-react-hooks'
import { getExpensesSince, MAX_INSTALLMENTS } from '@/features/expenses'
import { shiftMonth } from '@/utils/dates'
import { cardRepo } from './cardRepo'
import { buildCardSummary } from './summary'

// undefined while loading. The expenses that can still charge a statement (as far back as the
// longest installment plan) plus the paid statements, in one live query, so marking a
// statement or adding a card expense updates it at once.
export function useCardSummary() {
  return useLiveQuery(async () => {
    const now = new Date()
    const [expenses, statements] = await Promise.all([
      getExpensesSince(shiftMonth(now, -MAX_INSTALLMENTS)),
      cardRepo.all(),
    ])
    return { now, ...buildCardSummary(expenses, statements, now) }
  })
}
