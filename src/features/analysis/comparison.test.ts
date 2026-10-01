import { describe, expect, it } from 'vitest'
import type { Expense } from '@/lib/db'
import { changeByCategory, variableChange } from './comparison'

function expense(amount: number, category: string, spentAt: Date, fixed = false): Expense {
  const iso = spentAt.toISOString()
  return {
    id: `${category}-${iso}-${amount}`,
    amount,
    category,
    spentAt: iso,
    updatedAt: iso,
    deleted: false,
    pending: 0,
    ...(fixed && { fixedExpenseId: 'f', fixedPeriod: '2026-09' }),
  }
}

describe('changeByCategory', () => {
  const now = new Date(2026, 9, 5, 12) // October 5th
  const october = [expense(120, 'groceries', new Date(2026, 9, 3)), expense(50, 'delivery', now)]
  const september = [
    expense(100, 'groceries', new Date(2026, 8, 2)),
    expense(900, 'groceries', new Date(2026, 8, 20)), // after the 5th: not comparable yet
    expense(200, 'going_out', new Date(2026, 8, 1)),
    expense(5000, 'rent', new Date(2026, 8, 1), true), // fixed: never compared
  ]

  it('compares the month in progress with the month before up to the same day', () => {
    expect(changeByCategory(october, september, true, now)).toEqual(
      new Map([['groceries', 0.2]]), // 120 vs 100; delivery had nothing before
    )
  })

  it('compares a past month with the whole month before', () => {
    const changes = changeByCategory(october, september, false, now)
    expect(changes.get('groceries')).toBeCloseTo(-0.88) // 120 vs 1000
  })
})

describe('variableChange', () => {
  const now = new Date(2026, 9, 5, 12)
  const october = [expense(170, 'groceries', new Date(2026, 9, 3))]
  const september = [
    expense(100, 'groceries', new Date(2026, 8, 2)),
    expense(900, 'groceries', new Date(2026, 8, 20)),
    expense(5000, 'rent', new Date(2026, 8, 1), true),
  ]

  it('compares the variable total, up to the same day while the month goes on', () => {
    expect(variableChange(october, september, true, now)).toBeCloseTo(0.7) // 170 vs 100
    expect(variableChange(october, september, false, now)).toBeCloseTo(-0.83) // 170 vs 1000
  })

  it('is null without anything to compare with', () => {
    expect(variableChange(october, [], true, now)).toBeNull()
  })
})
