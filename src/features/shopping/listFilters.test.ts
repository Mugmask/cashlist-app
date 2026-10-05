import { describe, expect, it } from 'vitest'
import {
  applyListFilters,
  countListFilters,
  readListFilters,
  writeListFilters,
} from './listFilters'

const items = [
  { name: 'Tomate', status: 'to_buy' as const },
  { name: 'Banana', status: 'in_cart' as const },
  { name: 'Leche', status: 'to_buy' as const },
  { name: 'Pilas', status: 'in_cart' as const, aisle: 'cleaning' },
]

describe('list filters', () => {
  it('round-trip through the URL, leaving it clean when nothing is filtered', () => {
    const filters = { aisle: 'produce' as const, show: 'in_cart' as const }
    expect(writeListFilters(filters).toString()).toBe('seccion=produce&ver=carrito')
    expect(readListFilters(writeListFilters(filters))).toEqual(filters)
    expect(writeListFilters({}).toString()).toBe('')
    expect(readListFilters(new URLSearchParams('seccion=nope&ver=x'))).toEqual({
      aisle: undefined,
      show: undefined,
    })
    expect(countListFilters(filters)).toBe(2)
  })

  it('narrows by section (the one picked, else the guess) and by status', () => {
    const names = (f: Parameters<typeof applyListFilters>[1]) =>
      applyListFilters(items, f).map((i) => i.name)
    expect(names({})).toEqual(['Tomate', 'Banana', 'Leche', 'Pilas'])
    expect(names({ aisle: 'produce' })).toEqual(['Tomate', 'Banana'])
    expect(names({ aisle: 'cleaning' })).toEqual(['Pilas'])
    expect(names({ show: 'in_cart' })).toEqual(['Banana', 'Pilas'])
    expect(names({ aisle: 'produce', show: 'to_buy' })).toEqual(['Tomate'])
  })
})
