import { describe, expect, it } from 'vitest'
import type { Expense } from '@/lib/db'
import { forMonth, splitInstallments } from './installments'

function purchase(amount: number, spentAt: Date, installments?: number): Expense {
  const iso = spentAt.toISOString()
  return {
    id: 'x',
    amount,
    category: 'other',
    spentAt: iso,
    updatedAt: iso,
    deleted: false,
    pending: 0,
    paymentMethod: 'card',
    installments,
  }
}

describe('splitInstallments', () => {
  it('splits evenly and lets the last one absorb the rounding', () => {
    expect(splitInstallments(300000, 6)).toEqual(Array(6).fill(50000))
    expect(splitInstallments(100, 3)).toEqual([33.33, 33.33, 33.34])
    expect(splitInstallments(1500, 1)).toEqual([1500])
  })

  it('splits in whole cents, without floating point leaving one installment off', () => {
    expect(splitInstallments(12289.08, 12)).toEqual(Array(12).fill(1024.09))
    expect(splitInstallments(1.74, 3)).toEqual([0.58, 0.58, 0.58])
  })
})

describe('forMonth', () => {
  const tv = purchase(300000, new Date(2026, 7, 20), 6) // August, 6 × 50.000

  it('gives each month its installment, saying which one', () => {
    expect(forMonth(tv, '2026-08')).toMatchObject({
      amount: 50000,
      installment: { number: 1, count: 6, total: 300000 },
    })
    expect(forMonth(tv, '2027-01')?.installment?.number).toBe(6)
    expect(forMonth(tv, '2026-07')).toBeNull()
    expect(forMonth(tv, '2027-02')).toBeNull()
  })

  it('leaves a single payment whole, only in its own month', () => {
    const lunch = purchase(12000, new Date(2026, 8, 3))
    expect(forMonth(lunch, '2026-09')).toBe(lunch)
    expect(forMonth(lunch, '2026-10')).toBeNull()
  })
})
