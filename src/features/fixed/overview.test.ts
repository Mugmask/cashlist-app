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

describe('buildFixedOverview in dollars', () => {
  const today = new Date(2026, 8, 10, 12)
  const spotify: FixedExpense = {
    ...fixed('Spotify', 12, 20),
    currency: 'USD',
    paymentMethod: 'card',
  }
  const vpn: FixedExpense = { ...fixed('VPN', 5, 20), currency: 'USD' } // cash: blue
  const paidInDollars: Expense = {
    ...payment('Spotify', 24000, '2026-09-05T10:00:00.000Z'),
    currency: 'USD',
    foreignAmount: 12,
    exchangeRate: 2000,
    exchangeRateKind: 'tarjeta',
  }

  it('estimates pending dollars in pesos at the rate for how they are paid', () => {
    const { pending, totals } = buildFixedOverview([spotify, vpn], [], today, {
      tarjeta: 2000,
      blue: 1500,
    })
    expect(pending.map((l) => [l.fixed.id, l.amount, l.shown])).toEqual([
      ['Spotify', 24000, { value: 12, currency: 'USD' }],
      ['VPN', 7500, { value: 5, currency: 'USD' }],
    ])
    expect(totals.expected).toBe(31500)
  })

  it('counts a dollar one as 0 pesos until a rate is known', () => {
    expect(buildFixedOverview([vpn], [], today).totals.expected).toBe(0)
  })

  it('uses what was actually paid, and shows it in dollars', () => {
    const { paid, totals } = buildFixedOverview([spotify], [paidInDollars], today, {
      tarjeta: 9999,
    })
    expect(paid[0].amount).toBe(24000)
    expect(paid[0].shown).toEqual({ value: 12, currency: 'USD' })
    expect(totals).toEqual({ expected: 24000, paid: 24000, remaining: 0 })
  })
})
