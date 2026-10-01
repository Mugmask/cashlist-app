import { describe, expect, it } from 'vitest'
import type { Expense } from '@/lib/db'
import { chargedAfter, chargeOn, splitInstallments } from './installments'

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
    expect(chargedAfter(tv, '2026-07')).toBe(300000)
    expect(chargedAfter(tv, '2027-01')).toBe(0)
  })
})
