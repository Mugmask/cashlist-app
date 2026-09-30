import { describe, expect, it } from 'vitest'
import type { Budget, Expense } from '@/lib/db'
import { buildBudgetOverview } from './overview'

const ISO = '2026-09-10T10:00:00.000Z'

function budget(id: string, amount: number): Budget {
  return { id, amount, updatedAt: ISO, deleted: false, pending: 0 }
}

function expense(category: string, amount: number): Expense {
  return {
    id: crypto.randomUUID(),
    category,
    amount,
    spentAt: ISO,
    updatedAt: ISO,
    deleted: false,
    pending: 0,
  }
}

const CATEGORIES = ['groceries', 'delivery', 'rent', 'other']

describe('buildBudgetOverview', () => {
  const overview = buildBudgetOverview(
    [budget('groceries', 100), budget('delivery', 50)],
    [
      expense('groceries', 30),
      expense('groceries', 20),
      expense('delivery', 60),
      expense('rent', 500),
    ],
    CATEGORIES,
  )

  it('computes spent, remaining and ratio per budgeted category, most at risk first', () => {
    expect(overview.lines).toEqual([
      { category: 'delivery', limit: 50, spent: 60, remaining: -10, ratio: 1.2 },
      { category: 'groceries', limit: 100, spent: 50, remaining: 50, ratio: 0.5 },
    ])
  })

  it('lists categories without a budget in the given order, with what was spent', () => {
    expect(overview.unbudgeted).toEqual([
      { category: 'rent', spent: 500 },
      { category: 'other', spent: 0 },
    ])
  })

  it('totals only budgeted categories', () => {
    expect(overview.totals).toEqual({ limit: 150, spent: 110, remaining: 40 })
  })

  it('handles no budgets at all', () => {
    const empty = buildBudgetOverview([], [expense('rent', 500)], CATEGORIES)
    expect(empty.lines).toEqual([])
    expect(empty.unbudgeted).toHaveLength(4)
    expect(empty.totals).toEqual({ limit: 0, spent: 0, remaining: 0 })
  })
})
