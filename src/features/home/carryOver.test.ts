import { describe, expect, it } from 'vitest'
import type { Expense, Income } from '@/lib/db'
import { carryOver } from './carryOver'

function expense(amount: number, spentAt: string, patch: Partial<Expense> = {}): Expense {
  const iso = new Date(spentAt).toISOString()
  return {
    id: spentAt,
    amount,
    category: 'other',
    spentAt: iso,
    updatedAt: iso,
    deleted: false,
    pending: 0,
    ...patch,
  }
}

// A month kept whole in the app has its fixed expenses paid
const rent = (amount: number, spentAt: string) =>
  expense(amount, spentAt, { fixedExpenseId: 'rent', category: 'rent' })

describe('carryOver', () => {
  it('is nothing before the first month with a fixed expense paid', () => {
    expect(carryOver([], 1000, '2026-10')).toBeNull()
    expect(carryOver([rent(500, '2026-10-05T12:00')], 1000, '2026-10')).toBeNull()
    expect(carryOver([expense(500, '2026-09-05T12:00')], 1000, '2026-10')).toBeNull()
  })

  it('carries what the previous month overspent', () => {
    const list = [rent(2_465_334.55, '2026-09-10T12:00'), expense(100, '2026-10-02T12:00')]
    expect(carryOver(list, 2_000_000, '2026-10')).toEqual({
      amount: -465_334.55,
      from: '2026-09',
      to: '2026-09',
    })
  })

  it('adds up every month since the first, leftovers too', () => {
    const list = [rent(1500, '2026-08-10T12:00'), expense(400, '2026-09-10T12:00')]
    // August -500, September +600, October with no expenses +1000
    expect(carryOver(list, 1000, '2026-11')).toEqual({
      amount: 1100,
      from: '2026-08',
      to: '2026-10',
    })
  })

  it('leaves out earlier months, but counts their installments where they fall', () => {
    // 3000 in 3, bought in August, loaded for its installments: 1000 of it falls in September
    const list = [
      expense(3000, '2026-08-20T12:00', { installments: 3 }),
      rent(500, '2026-09-01T12:00'),
    ]
    expect(carryOver(list, 2000, '2026-10')).toEqual({
      amount: 500,
      from: '2026-09',
      to: '2026-09',
    })
  })

  it('adds what came in each month apart from the monthly income', () => {
    const received = (amount: number, at: string): Income => ({
      id: at,
      amount,
      receivedAt: new Date(at).toISOString(),
      updatedAt: at,
      deleted: false,
      pending: 0,
    })
    const list = [rent(2_465_334.55, '2026-09-10T12:00')]
    const incomes = [
      received(247_900, '2026-09-18T12:00'),
      received(31_206.86, '2026-09-03T12:00'),
      received(99_999, '2026-10-02T12:00'), // October's: not part of what September left
    ]
    expect(carryOver(list, 2_000_000, '2026-10', incomes)?.amount).toBe(-186_227.69)
  })

  it('adds in cents, without float drift', () => {
    const list = [rent(0.1, '2026-08-01T12:00'), expense(0.2, '2026-09-01T12:00')]
    expect(carryOver(list, 0, '2026-10')?.amount).toBe(-0.3)
  })
})
