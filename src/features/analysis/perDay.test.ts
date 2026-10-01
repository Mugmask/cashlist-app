import { describe, expect, it } from 'vitest'
import type { MonthExpense } from '@/features/expenses'
import { perDay, weeksOf } from './perDay'

function expense(amount: number, spentAt: string, patch: Partial<MonthExpense> = {}): MonthExpense {
  const iso = new Date(spentAt).toISOString()
  return {
    id: `${spentAt}-${amount}`,
    amount,
    category: 'other',
    spentAt: iso,
    updatedAt: iso,
    deleted: false,
    pending: 0,
    ...patch,
  }
}

const october = new Date(2026, 9, 1) // 31 days

describe('weeksOf', () => {
  it('splits the month in 1–7, 8–14, 15–21 and 22 to the end', () => {
    const weeks = weeksOf([], october, null)
    expect(weeks.map((w) => [w.from, w.to])).toEqual([
      [1, 7],
      [8, 14],
      [15, 21],
      [22, 31],
    ])
  })

  it('adds variable spending only: no fixed ones, no installments of earlier purchases', () => {
    const weeks = weeksOf(
      [
        expense(100, '2026-10-02T12:00'),
        expense(50, '2026-10-07T20:00'),
        expense(30, '2026-10-30T12:00'),
        expense(900, '2026-10-01T12:00', { fixedExpenseId: 'rent' }),
        expense(400, '2026-08-15T12:00'), // an installment that falls in October
      ],
      october,
      null,
    )
    expect(weeks.map((w) => w.total)).toEqual([150, 0, 0, 30])
  })

  it('tells past, current and future weeks apart', () => {
    expect(weeksOf([], october, 10).map((w) => w.when)).toEqual([
      'past',
      'current',
      'future',
      'future',
    ])
    expect(weeksOf([], october, null).every((w) => w.when === 'past')).toBe(true)
  })
})

describe('perDay', () => {
  const expenses = [
    expense(10_000, '2026-10-01T12:00'),
    expense(20_000, '2026-10-05T12:00'),
    expense(300_000, '2026-10-01T12:00', { fixedExpenseId: 'rent' }),
  ]

  it('gives the pace of variable spending so far', () => {
    expect(perDay({ expenses, month: october, today: 10, spent: 330_000, committed: 0 })).toEqual({
      pace: 3000,
    })
  })

  it('splits what is free over the days left, and projects the end of the month', () => {
    const { budget } = perDay({
      expenses,
      month: october,
      today: 10,
      available: 1_000_000,
      spent: 330_000,
      committed: 50_000,
    })
    // 1.000.000 - 330.000 - 50.000 = 620.000 free, over 22 days (10 to 31)
    expect(budget).toEqual({
      perDay: 28_181,
      daysLeft: 22,
      free: 620_000,
      projected: 620_000 - 3000 * 21,
    })
  })

  it('has nothing to spend per day once over', () => {
    const { budget } = perDay({
      expenses,
      month: october,
      today: 10,
      available: 300_000,
      spent: 330_000,
      committed: 0,
    })
    expect(budget?.perDay).toBe(0)
    expect(budget?.free).toBe(-30_000)
  })

  it('for a month gone, the pace over all its days and no budget', () => {
    expect(
      perDay({ expenses, month: october, today: null, available: 1, spent: 0, committed: 0 }),
    ).toEqual({ pace: Math.round(30_000 / 31) })
  })
})
