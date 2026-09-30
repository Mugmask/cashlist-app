import { describe, expect, it } from 'vitest'
import type { Expense, FixedExpense } from '@/lib/db'
import { buildFixedOverview } from './overview'

const ISO = '2026-09-01T10:00:00.000Z'

function fixed(id: string, amount: number, dueDay?: number): FixedExpense {
  return {
    id,
    name: id,
    category: 'rent',
    amount,
    dueDay,
    updatedAt: ISO,
    deleted: false,
    pending: 0,
  }
}

function payment(fixedExpenseId: string, amount: number, spentAt: string): Expense {
  return {
    id: `p-${fixedExpenseId}-${spentAt}`,
    amount,
    category: 'rent',
    spentAt,
    fixedExpenseId,
    fixedPeriod: '2026-09',
    updatedAt: spentAt,
    deleted: false,
    pending: 0,
  }
}

describe('buildFixedOverview', () => {
  const today = new Date(2026, 8, 10, 12) // September 10th

  const overview = buildFixedOverview(
    [
      fixed('Alquiler', 300000, 5), // paid
      fixed('Expensas', 80000, 8), // overdue
      fixed('Internet', 20000, 10), // due today
      fixed('Luz', 15000, 25), // upcoming
      fixed('Gimnasio', 30000, 31), // upcoming, 31 → 30 in September
      fixed('Netflix', 9000), // no date
    ],
    [payment('Alquiler', 320000, '2026-09-04T10:00:00.000Z')],
    today,
  )

  it('orders pending by urgency, then due day', () => {
    expect(overview.pending.map((l) => [l.fixed.id, l.status, l.dueDay])).toEqual([
      ['Expensas', 'overdue', 8],
      ['Internet', 'due_today', 10],
      ['Luz', 'upcoming', 25],
      ['Gimnasio', 'upcoming', 30],
      ['Netflix', 'no_date', undefined],
    ])
  })

  it('uses the paid amount for paid ones, and the suggested amount for the rest', () => {
    expect(overview.paid.map((l) => [l.fixed.id, l.amount])).toEqual([['Alquiler', 320000]])
    expect(overview.totals).toEqual({
      expected: 320000 + 80000 + 20000 + 15000 + 30000 + 9000,
      paid: 320000,
      remaining: 80000 + 20000 + 15000 + 30000 + 9000,
    })
  })

  it('takes the latest payment if one was recorded twice', () => {
    const twice = buildFixedOverview(
      [fixed('Luz', 15000, 25)],
      [
        payment('Luz', 15000, '2026-09-02T10:00:00.000Z'),
        payment('Luz', 16000, '2026-09-03T10:00:00.000Z'),
      ],
      today,
    )
    expect(twice.paid[0].amount).toBe(16000)
  })
})
