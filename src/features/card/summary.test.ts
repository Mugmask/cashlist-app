import { describe, expect, it } from 'vitest'
import type { Expense, PaymentMethod } from '@/lib/db'
import { buildCardSummary } from './summary'

function expense(
  amount: number,
  spentAt: Date,
  paymentMethod?: PaymentMethod,
  installments?: number,
): Expense {
  const iso = spentAt.toISOString()
  return {
    installments,
    id: crypto.randomUUID(),
    amount,
    category: 'other',
    spentAt: iso,
    updatedAt: iso,
    deleted: false,
    pending: 0,
    paymentMethod,
  }
}

const now = new Date(2026, 9, 10) // October 10th

describe('buildCardSummary', () => {
  const expenses = [
    expense(1000, new Date(2026, 9, 2), 'card'), // this month, card
    expense(500, new Date(2026, 9, 8), 'card'),
    expense(9999, new Date(2026, 9, 3), 'cash'), // cash never counts
    expense(8888, new Date(2026, 9, 4)), // no method (older rows): cash
    expense(3000, new Date(2026, 8, 20), 'card'), // last month: not this statement
  ]

  it('adds up this month on the card, to be paid next month', () => {
    expect(buildCardSummary(expenses, now).current).toEqual({
      period: '2026-10',
      total: 1500,
      count: 2,
    })
  })

  it('charges installments one per statement, and keeps the rest as upcoming', () => {
    const summary = buildCardSummary(
      [
        expense(300000, new Date(2026, 7, 20), 'card', 6), // August, 6 × 50.000
        expense(1000, new Date(2026, 9, 2), 'card'), // this month
      ],
      now,
    )
    // October: 3rd installment + this month's purchase
    expect(summary.current).toEqual({ period: '2026-10', total: 51000, count: 2 })
    expect(summary.upcoming).toBe(150000) // 4th to 6th
  })
})
