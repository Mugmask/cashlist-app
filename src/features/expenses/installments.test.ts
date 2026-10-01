import { describe, expect, it } from 'vitest'
import type { Expense } from '@/lib/db'
import { chargedAfter, chargeOn, forMonth, splitInstallments } from './installments'

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

describe('chargeOn', () => {
  const tv = purchase(300000, new Date(2026, 7, 20), 6) // August, 6 installments

  it('charges one installment per statement, from the month it was bought', () => {
    expect(chargeOn(tv, '2026-07')).toBe(0) // before buying it
    expect(chargeOn(tv, '2026-08')).toBe(50000) // 1st
    expect(chargeOn(tv, '2027-01')).toBe(50000) // 6th, across the new year
    expect(chargeOn(tv, '2027-02')).toBe(0) // all paid
  })

  it('charges a single payment whole in its own month', () => {
    const lunch = purchase(12000, new Date(2026, 8, 3))
    expect(chargeOn(lunch, '2026-09')).toBe(12000)
    expect(chargeOn(lunch, '2026-10')).toBe(0)
  })
})

describe('chargedAfter', () => {
  it('is what the installments after a statement add up to', () => {
    const tv = purchase(300000, new Date(2026, 7, 20), 6)
    expect(chargedAfter(tv, '2026-09')).toBe(200000) // 2 of 6 charged by September
    expect(chargedAfter(tv, '2026-07')).toBe(0) // not bought yet
    expect(chargedAfter(tv, '2027-01')).toBe(0)
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
