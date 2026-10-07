import { describe, expect, it } from 'vitest'
import type { CustomCategory, Expense, ShoppingItem } from '@/lib/db'
import { categoriesTable, expensesTable, shoppingItemsTable } from './tables'

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

describe('categoriesTable', () => {
  const category = (changes: Partial<CustomCategory> = {}): CustomCategory => ({
    id: 'c1',
    name: 'Supermercado',
    icon: '',
    color: 5,
    updatedAt: '2026-10-02T12:00:00Z',
    deleted: false,
    pending: 1,
    ...changes,
  })

  it('round-trips an exact color, and sends null without one', () => {
    const row = categoriesTable.toRow(category({ customColor: '#12ab34' }))
    expect(row.custom_color).toBe('#12ab34')
    expect(categoriesTable.fromRow({ ...row, synced_at: '' } as never).customColor).toBe('#12ab34')
    expect(categoriesTable.toRow(category()).custom_color).toBeNull()
  })

  it("round-trips a built-in one's key, and leaves the user's own without it", () => {
    const row = categoriesTable.toRow(category({ builtIn: 'groceries' }))
    expect(row.builtin).toBe('groceries')
    expect(categoriesTable.fromRow({ ...row, synced_at: '' } as never).builtIn).toBe('groceries')

    const own = categoriesTable.toRow(category())
    expect(own.builtin).toBeNull()
    expect(categoriesTable.fromRow({ ...own, synced_at: '' } as never)).not.toHaveProperty(
      'builtIn',
    )
  })
})

describe('expensesTable', () => {
  const expense = (changes: Partial<Expense> = {}): Expense => ({
    id: 'e1',
    amount: 1000,
    category: 'other',
    spentAt: '2026-10-02T12:00:00Z',
    paymentMethod: 'card',
    updatedAt: '2026-10-02T12:00:00Z',
    deleted: false,
    pending: 1,
    ...changes,
  })

  it("round-trips a card purchase's card, and sends null without one", () => {
    const row = expensesTable.toRow(expense({ cardId: 'visa' }))
    expect(row.card_id).toBe('visa')
    expect(expensesTable.fromRow({ ...row, synced_at: '' } as never).cardId).toBe('visa')

    const without = expensesTable.toRow(expense())
    expect(without.card_id).toBeNull()
    expect(expensesTable.fromRow({ ...without, synced_at: '' } as never)).not.toHaveProperty(
      'cardId',
    )
  })
})
