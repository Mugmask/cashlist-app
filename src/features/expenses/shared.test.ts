import { describe, expect, it } from 'vitest'
import type { Expense } from '@/lib/db'
import { chargedAfter, chargeOn } from './installments'
import { chargedOf, describeShare, shareOf, shareOptionFor } from './shared'

describe('shareOf', () => {
  it('splits in whole cents, the rounding on the others', () => {
    expect(shareOf(10000, 2)).toBe(5000)
    expect(shareOf(100, 3)).toBe(33.33)
    expect(shareOf(12289.08, 4)).toBe(3072.27)
  })
})

describe('shareOptionFor', () => {
  it('finds an even split, else an exact part', () => {
    expect(shareOptionFor(10000, 5000)).toBe('2')
    expect(shareOptionFor(100, 33.33)).toBe('3')
    expect(shareOptionFor(10000, 2500)).toBe('4')
    expect(shareOptionFor(10000, 7000)).toBe('part')
  })
})

describe('describeShare', () => {
  it('names an even split, nothing for an exact part or an expense not shared', () => {
    expect(describeShare({ amount: 5000, sharedTotal: 10000 })).toBe('A medias')
    expect(describeShare({ amount: 7000, sharedTotal: 10000 })).toBeNull()
    expect(describeShare({ amount: 5000 })).toBeNull()
  })
})

describe('a shared card purchase', () => {
  const spentAt = new Date(2026, 8, 10).toISOString()
  const dinner: Expense = {
    id: 'x',
    amount: 15000, // my half
    sharedTotal: 30000,
    category: 'delivery',
    spentAt,
    updatedAt: spentAt,
    deleted: false,
    pending: 0,
    paymentMethod: 'card',
    installments: 3,
  }

  it('is charged whole by the card, in installments', () => {
    expect(chargedOf(dinner)).toBe(30000)
    expect(chargeOn(dinner, '2026-09')).toBe(10000)
    expect(chargedAfter(dinner, '2026-09')).toBe(20000)
  })
})
