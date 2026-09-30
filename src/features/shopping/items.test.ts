import { describe, expect, it } from 'vitest'
import type { ShoppingItem, ShoppingItemStatus } from '@/lib/db'
import { buyAgainSuggestions, normalizeName, parseItemInput, splitList } from './items'

describe('parseItemInput', () => {
  it.each([
    ['leche', { name: 'Leche', quantity: 1 }],
    ['leche x2', { name: 'Leche', quantity: 2 }],
    ['Leche X 3', { name: 'Leche', quantity: 3 }],
    ['2 leches', { name: 'Leches', quantity: 2 }],
    ['6x huevos', { name: 'Huevos', quantity: 6 }],
    ['  pan   lactal  ', { name: 'Pan lactal', quantity: 1 }],
    ['Coca 2.25', { name: 'Coca 2.25', quantity: 1 }], // a number that isn't a quantity
    ['agua x500', { name: 'Agua', quantity: 99 }], // capped
  ])('%j → %j', (text, expected) => {
    expect(parseItemInput(text)).toEqual(expected)
  })

  it.each(['', '   ', 'x2', 'leche x0'])('%j is not an item', (text) => {
    expect(parseItemInput(text)).toBeNull()
  })
})

describe('normalizeName', () => {
  it('ignores case, accents and extra spaces', () => {
    expect(normalizeName('  Azúcar  Mascabo ')).toBe(normalizeName('azucar mascabo'))
  })
})

let seq = 0
function item(
  name: string,
  status: ShoppingItemStatus,
  patch: Partial<ShoppingItem> = {},
): ShoppingItem {
  seq += 1
  const at = `2026-09-${String(seq).padStart(2, '0')}T10:00:00.000Z`
  return {
    id: `i${seq}`,
    name,
    quantity: 1,
    status,
    boughtAt: status === 'bought' ? at : undefined,
    updatedAt: at,
    deleted: false,
    pending: 0,
    ...patch,
  }
}

describe('buyAgainSuggestions', () => {
  it('suggests bought products by frequency, skipping what is already on the list', () => {
    const items = [
      item('Leche', 'bought'),
      item('leche', 'bought'),
      item('Pan', 'bought'),
      item('Yerba', 'bought'),
      item('Yerba', 'bought'),
      item('Yerba', 'bought'),
      item('Pan', 'to_buy'), // already on the list
      item('Café', 'bought', { deleted: true }), // deleted history doesn't count
    ]

    expect(buyAgainSuggestions(items, 5)).toEqual([
      { name: 'Yerba', timesBought: 3 },
      { name: 'leche', timesBought: 2 }, // keeps the most recent spelling
    ])
  })

  it('respects the limit', () => {
    const items = ['A', 'B', 'C'].map((n) => item(n, 'bought'))
    expect(buyAgainSuggestions(items, 2)).toHaveLength(2)
  })
})

describe('splitList', () => {
  it('sorts to-buy alphabetically and in-cart by most recently checked', () => {
    const { toBuy, inCart } = splitList([
      item('yerba', 'to_buy'),
      item('Azúcar', 'to_buy'),
      item('Huevos', 'in_cart', { updatedAt: '2026-09-01T00:00:00.000Z' }),
      item('Pan', 'in_cart', { updatedAt: '2026-09-02T00:00:00.000Z' }),
      item('Leche', 'bought'),
      item('Borrado', 'to_buy', { deleted: true }),
    ])

    expect(toBuy.map((i) => i.name)).toEqual(['Azúcar', 'yerba'])
    expect(inCart.map((i) => i.name)).toEqual(['Pan', 'Huevos'])
  })
})
