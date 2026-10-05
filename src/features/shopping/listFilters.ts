import type { ShoppingItem } from '@/lib/db'
import { AISLES, aisleOf, type AisleId } from './aisles'

// What the shopping list can be narrowed to: one store section, and what's still to buy or
// what's in the cart. Kept in the URL ("?seccion=verduleria&ver=carrito"), like the expenses'.
export interface ListFilters {
  aisle?: AisleId
  show?: 'to_buy' | 'in_cart'
}

// Spelled out, so merged over the current filters it clears them
export const NO_LIST_FILTERS: ListFilters = { aisle: undefined, show: undefined }

const SHOW_PARAM = { to_buy: 'comprar', in_cart: 'carrito' } as const

export function readListFilters(params: URLSearchParams): ListFilters {
  const aisle = AISLES.find((a) => a.id === params.get('seccion'))?.id
  const show = (Object.keys(SHOW_PARAM) as (keyof typeof SHOW_PARAM)[]).find(
    (s) => SHOW_PARAM[s] === params.get('ver'),
  )
  return { aisle, show }
}

// Only what differs from no filter, so a clean list has a clean URL
export function writeListFilters(filters: ListFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.aisle) params.set('seccion', filters.aisle)
  if (filters.show) params.set('ver', SHOW_PARAM[filters.show])
  return params
}

export function countListFilters(filters: ListFilters) {
  return writeListFilters(filters).size
}

// The products on the list that pass the filters
export function applyListFilters<T extends Pick<ShoppingItem, 'name' | 'aisle' | 'status'>>(
  items: readonly T[],
  filters: ListFilters,
): T[] {
  return items.filter(
    (i) =>
      (!filters.aisle || aisleOf(i) === filters.aisle) &&
      (!filters.show || i.status === filters.show),
  )
}
