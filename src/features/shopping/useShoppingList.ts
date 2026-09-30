import { useLiveQuery } from 'dexie-react-hooks'
import { buyAgainSuggestions, splitList } from './items'
import { shoppingRepo } from './shoppingRepo'

const SUGGESTION_COUNT = 8

// undefined while loading; updates whenever the local list changes
export function useShoppingList() {
  return useLiveQuery(async () => {
    const items = await shoppingRepo.all()
    return { ...splitList(items), suggestions: buyAgainSuggestions(items, SUGGESTION_COUNT) }
  })
}
