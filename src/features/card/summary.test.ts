import { describe, expect, it } from 'vitest'
import type { CardStatement, Expense, PaymentMethod } from '@/lib/db'
import { buildCardSummary } from './summary'

function expense(amount: number, spentAt: Date, paymentMethod?: PaymentMethod): Expense {
  const iso = spentAt.toISOString()
  return {
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

function statement(id: string, deleted = false): CardStatement {
  const iso = '2026-10-05T10:00:00.000Z'
  return { id, paidAt: iso, updatedAt: iso, deleted, pending: 0 }
}

const now = new Date(2026, 9, 10) // October 10th

describe('buildCardSummary', () => {
  const expenses = [
    expense(1000, new Date(2026, 9, 2), 'card'), // this month, card
    expense(500, new Date(2026, 9, 8), 'card'),
    expense(9999, new Date(2026, 9, 3), 'cash'), // cash never counts
    expense(8888, new Date(2026, 9, 4)), // no method (older rows): cash
    expense(3000, new Date(2026, 8, 20), 'card'), // last month: the statement due now
    expense(7777, new Date(2026, 7, 20), 'card'), // two months ago: not shown
  ]

  it('adds up this month on the card, to be paid next month', () => {
    expect(buildCardSummary(expenses, [], now).current).toEqual({
      period: '2026-10',
      total: 1500,
      count: 2,
    })
  })

  it('shows last month as the statement due, unpaid until marked', () => {
    expect(buildCardSummary(expenses, [], now).previous).toEqual({
      period: '2026-09',
      total: 3000,
      paid: false,
    })
    expect(buildCardSummary(expenses, [statement('2026-09')], now).previous?.paid).toBe(true)
  })

  it('an unmarked (deleted) statement counts as unpaid again', () => {
    expect(buildCardSummary(expenses, [statement('2026-09', true)], now).previous?.paid).toBe(false)
  })

  it('has no statement to pay when nothing went on the card last month', () => {
    const summary = buildCardSummary([expense(100, new Date(2026, 9, 1), 'card')], [], now)
    expect(summary.previous).toBeNull()
  })

  it('handles January: the previous statement is December of last year', () => {
    const january = new Date(2027, 0, 5)
    const summary = buildCardSummary([expense(400, new Date(2026, 11, 28), 'card')], [], january)
    expect(summary.previous).toMatchObject({ period: '2026-12', total: 400 })
  })
})
