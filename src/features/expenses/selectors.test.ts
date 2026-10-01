import { describe, expect, it } from 'vitest'
import type { Expense } from '@/lib/db'
import { firstTrackedPeriod, groupByDay, summarizeMonth, totalsByCategory } from './selectors'

function expense(id: string, spentAt: Date, amount: number, category = 'other'): Expense {
  const iso = spentAt.toISOString()
  return { id, amount, category, spentAt: iso, updatedAt: iso, deleted: false, pending: 0 }
}

describe('summarizeMonth', () => {
  it('splits fixed and variable', () => {
    const now = new Date(2026, 8, 10, 15)
    const rent = {
      ...expense('r', now, 5000, 'rent'),
      fixedExpenseId: 'f1',
      fixedPeriod: '2026-09',
    }
    const summary = summarizeMonth([expense('a', now, 700), expense('b', now, 300), rent])
    expect(summary).toEqual({
      total: 6000,
      fixedTotal: 5000,
      variableTotal: 1000,
    })
  })

  it('is zero with no expenses', () => {
    expect(summarizeMonth([])).toEqual({
      total: 0,
      fixedTotal: 0,
      variableTotal: 0,
    })
  })
})

describe('groupByDay', () => {
  it('groups by local day keeping order, with a total per day', () => {
    const groups = groupByDay([
      expense('a', new Date(2026, 8, 30, 20), 100),
      expense('b', new Date(2026, 8, 30, 8), 50),
      expense('c', new Date(2026, 8, 28, 12), 25),
    ])

    expect(groups.map((g) => [g.key, g.expenses.map((e) => e.id), g.total])).toEqual([
      ['2026-09-30', ['a', 'b'], 150],
      ['2026-09-28', ['c'], 25],
    ])
  })

  it('returns no groups for no expenses', () => {
    expect(groupByDay([])).toEqual([])
  })
})

describe('totalsByCategory', () => {
  it('sums per category and sorts biggest first', () => {
    const day = new Date(2026, 8, 30)
    const totals = totalsByCategory([
      expense('a', day, 100, 'groceries'),
      expense('b', day, 300, 'rent'),
      expense('c', day, 50, 'groceries'),
    ])

    expect(totals).toEqual([
      { category: 'rent', total: 300, count: 1 },
      { category: 'groceries', total: 150, count: 2 },
    ])
  })
})

describe('firstTrackedPeriod', () => {
  it('goes by the month a fixed payment pays, not the day it was paid', () => {
    // September's rent, paid early on August 31st
    const rent = {
      ...expense('rent', new Date(2026, 7, 31, 12), 300_000),
      fixedExpenseId: 'f',
      fixedPeriod: '2026-09',
    }
    expect(firstTrackedPeriod([rent, expense('tv', new Date(2026, 6, 10), 90_000)])).toBe('2026-09')
  })
})
