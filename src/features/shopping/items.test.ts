import { describe, expect, it } from 'vitest'
import type { ShoppingItem, ShoppingItemStatus } from '@/lib/db'
import { parseItemInput, splitShopping } from './items'

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

let seq = 0
function item(
  name: string,
  status: ShoppingItemStatus,
  patch: Partial<ShoppingItem> = {},
): ShoppingItem {
  seq += 1
  return {
    id: `i${seq}`,
    name,
    quantity: 1,
    status,
    timesBought: 0,
    updatedAt: `2026-09-${String(seq).padStart(2, '0')}T10:00:00.000Z`,
    deleted: false,
    pending: 0,
    ...patch,
  }
}

describe('splitShopping', () => {
  const { toBuy, inCart, pantry } = splitShopping([
    item('yerba', 'to_buy'),
    item('Azúcar', 'to_buy'),
    item('Huevos', 'in_cart', { updatedAt: '2026-09-01T00:00:00.000Z' }),
    item('Pan', 'in_cart', { updatedAt: '2026-09-02T00:00:00.000Z' }),
    item('Leche', 'in_stock'),
    item('Borrado', 'in_stock', { deleted: true }),
  ])

  it('sorts to-buy alphabetically and the cart by most recently checked', () => {
    expect(toBuy.map((i) => i.name)).toEqual(['Azúcar', 'yerba'])
    expect(inCart.map((i) => i.name)).toEqual(['Pan', 'Huevos'])
  })

  it('the pantry has every product, alphabetically, without deleted ones', () => {
    expect(pantry.map((i) => i.name)).toEqual(['Azúcar', 'Huevos', 'Leche', 'Pan', 'yerba'])
  })
})
