import { describe, expect, it } from 'vitest'
import type { Expense } from '@/lib/db'
import { BUILT_IN_CATEGORIES } from './categories'
import { rankByUse } from './categoryUsage'

const expense = (category: string, changes: Partial<Expense> = {}): Expense => ({
  id: crypto.randomUUID(),
  amount: 100,
  category,
  spentAt: '2026-10-01T12:00:00Z',
  updatedAt: '2026-10-01T12:00:00Z',
  deleted: false,
  pending: 0,
  ...changes,
})

describe('rankByUse', () => {
  it('puts the most used first and keeps the usual order for the rest', () => {
    const ranked = rankByUse(BUILT_IN_CATEGORIES, [
      expense('transport'),
      expense('delivery'),
      expense('delivery'),
    ])

    expect(ranked.slice(0, 3).map((c) => c.id)).toEqual(['delivery', 'transport', 'groceries'])
    expect(ranked).toHaveLength(BUILT_IN_CATEGORIES.length)
  })

  it("doesn't count deleted expenses nor fixed expenses' payments", () => {
    const ranked = rankByUse(BUILT_IN_CATEGORIES, [
      expense('rent', { fixedExpenseId: 'f1' }),
      expense('utilities', { deleted: true }),
    ])

    expect(ranked.map((c) => c.id)).toEqual(BUILT_IN_CATEGORIES.map((c) => c.id))
  })
})
