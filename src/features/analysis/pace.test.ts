import { describe, expect, it } from 'vitest'
import type { MonthExpense } from '@/features/expenses'
import { cumulativeByDay } from './pace'

function expense(amount: number, spentAt: string): MonthExpense {
  const iso = new Date(spentAt).toISOString()
  return {
    id: spentAt,
    amount,
    category: 'other',
    spentAt: iso,
    updatedAt: iso,
    deleted: false,
    pending: 0,
  }
}

describe('cumulativeByDay', () => {
  const september = new Date(2026, 8, 1)

  it('adds up what was spent by the end of each day', () => {
    const days = cumulativeByDay(
      [
        expense(100, '2026-09-03T12:00'),
        expense(50, '2026-09-03T20:00'),
        expense(25, '2026-09-30T12:00'),
      ],
      september,
    )
    expect(days).toHaveLength(30)
    expect(days.slice(0, 4)).toEqual([0, 0, 150, 150])
    expect(days[29]).toBe(175)
  })

  it('puts installments of earlier purchases on the 1st', () => {
    const days = cumulativeByDay([expense(1000, '2026-07-18T12:00')], september)
    expect(days[0]).toBe(1000)
  })

  it('adds in cents, without float drift', () => {
    const days = cumulativeByDay(
      [expense(0.1, '2026-09-01T12:00'), expense(0.2, '2026-09-02T12:00')],
      september,
    )
    expect(days[1]).toBe(0.3)
  })
})
