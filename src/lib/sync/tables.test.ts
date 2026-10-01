import { describe, expect, it } from 'vitest'
import type { ShoppingItem } from '@/lib/db'
import { shoppingItemsTable } from './tables'

const item = (timesBought: number): ShoppingItem => ({
  id: 'a',
  name: 'Leche',
  quantity: 1,
  status: 'to_buy',
  timesBought,
  updatedAt: '2026-10-01T12:00:00Z',
  deleted: false,
  pending: 1,
})

describe('shoppingItemsTable.toRow', () => {
  it('sends times_bought as is', () => {
    expect(shoppingItemsTable.toRow(item(3)).times_bought).toBe(3)
  })

  // The column is not null: a row missing it would block the whole table's upload
  it('sends 0 when the local row lacks it or has NaN', () => {
    expect(shoppingItemsTable.toRow(item(undefined as unknown as number)).times_bought).toBe(0)
    expect(shoppingItemsTable.toRow(item(NaN)).times_bought).toBe(0)
  })
})
