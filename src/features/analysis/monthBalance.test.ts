import { describe, expect, it } from 'vitest'
import type { Expense } from '@/lib/db'
import { monthBalance } from './monthBalance'

const rent = (amount: number, spentAt: string): Expense => ({
  id: spentAt,
  amount,
  category: 'rent',
  spentAt: new Date(spentAt).toISOString(),
  updatedAt: new Date(spentAt).toISOString(),
  deleted: false,
  pending: 0,
  fixedExpenseId: 'rent',
})

const base = { period: '2026-10', spent: 300, committed: 50, received: 0 }
const nothingBefore = { expenses: [], incomes: [] }

describe('monthBalance', () => {
  it('has nothing to measure against without any income', () => {
    expect(monthBalance({ ...base, earlier: nothingBefore })).toEqual({
      income: undefined,
      carry: null,
      available: undefined,
      spent: 300,
      committed: 50,
    })
  })

  it('adds the monthly income, what else came in, and what the months before left', () => {
    const balance = monthBalance({
      ...base,
      monthlyIncome: 1000,
      received: 200,
      earlier: { expenses: [rent(600, '2026-09-05T12:00')], incomes: [] },
    })
    expect(balance.income).toBe(1200)
    expect(balance.carry?.amount).toBe(400) // September: 1000 − 600
    expect(balance.available).toBe(1600)
  })

  it('carries nothing without a monthly income, even with other incomes', () => {
    const balance = monthBalance({
      ...base,
      received: 200,
      earlier: { expenses: [rent(600, '2026-09-05T12:00')], incomes: [] },
    })
    expect(balance).toMatchObject({ income: 200, carry: null, available: 200 })
  })
})
