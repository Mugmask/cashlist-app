import { useLiveQuery } from 'dexie-react-hooks'
import { splitShopping } from './items'
import { shoppingRepo } from './shoppingRepo'

export type ShoppingList = NonNullable<ReturnType<typeof useShoppingList>>

// undefined while loading; updates whenever the local pantry changes
export function useShoppingList() {
  return useLiveQuery(async () => splitShopping(await shoppingRepo.all()))
}
