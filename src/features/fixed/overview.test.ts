import { describe, expect, it } from 'vitest'
import type { Expense, FixedExpense } from '@/lib/db'
import { buildFixedOverview, dueIn, fixedForPeriod } from './overview'

const ISO = '2026-09-01T10:00:00.000Z'

function fixed(id: string, amount: number): FixedExpense {
  return {
    id,
    name: id,
    category: 'rent',
    amount,
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
  const overview = buildFixedOverview(
    [
      fixed('Alquiler', 300000), // paid
      fixed('Netflix', 9000),
      fixed('expensas', 80000),
      fixed('Internet', 20000),
    ],
    [payment('Alquiler', 320000, '2026-09-04T10:00:00.000Z')],
  )

  it('splits the month into paid and still to pay, the latter by name', () => {
    expect(overview.pending.map((l) => l.fixed.id)).toEqual(['expensas', 'Internet', 'Netflix'])
    expect(overview.paid.map((l) => l.fixed.id)).toEqual(['Alquiler'])
  })

  it('uses the paid amount for paid ones, and the suggested amount for the rest', () => {
    expect(overview.paid.map((l) => [l.fixed.id, l.amount])).toEqual([['Alquiler', 320000]])
    expect(overview.totals).toEqual({
      expected: 320000 + 80000 + 20000 + 9000,
      paid: 320000,
      remaining: 80000 + 20000 + 9000,
    })
  })

  it('takes the latest payment if one was recorded twice', () => {
    const twice = buildFixedOverview(
      [fixed('Luz', 15000)],
      [
        payment('Luz', 15000, '2026-09-02T10:00:00.000Z'),
        payment('Luz', 16000, '2026-09-03T10:00:00.000Z'),
      ],
    )
    expect(twice.paid[0].amount).toBe(16000)
  })
})

describe('buildFixedOverview in dollars', () => {
  const spotify: FixedExpense = {
    ...fixed('Spotify', 12),
    currency: 'USD',
    paymentMethod: 'card',
  }
  const vpn: FixedExpense = { ...fixed('VPN', 5), currency: 'USD' } // cash: blue
  const paidInDollars: Expense = {
    ...payment('Spotify', 24000, '2026-09-05T10:00:00.000Z'),
    currency: 'USD',
    foreignAmount: 12,
    exchangeRate: 2000,
    exchangeRateKind: 'tarjeta',
  }

  it('estimates pending dollars in pesos at the rate for how they are paid', () => {
    const { pending, totals } = buildFixedOverview([spotify, vpn], [], {
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
    expect(buildFixedOverview([vpn], []).totals.expected).toBe(0)
  })

  it('uses what was actually paid, and shows it in dollars', () => {
    const { paid, totals } = buildFixedOverview([spotify], [paidInDollars], {
      tarjeta: 9999,
    })
    expect(paid[0].amount).toBe(24000)
    expect(paid[0].shown).toEqual({ value: 12, currency: 'USD' })
    expect(totals).toEqual({ expected: 24000, paid: 24000, remaining: 0 })
  })
})

describe('fixedForPeriod', () => {
  const rent = fixed('rent', 300)
  const netflix = fixed('netflix', 10) // created in October: no payment before it
  const gym = { ...fixed('gym', 50), deleted: true } // paid in September, deleted since
  const all = [rent, netflix, gym]
  const septemberPayments = [payment('gym', 50, '2026-09-05T10:00:00.000Z')]

  it('shows the ones there now for the month going on', () => {
    expect(fixedForPeriod(all, [], new Set(), false).map((f) => f.id)).toEqual(['rent', 'netflix'])
  })

  it('shows a month gone as it was: what was paid, deleted or not, and what was in use', () => {
    const inUse = new Set(['rent', 'gym']) // paid in September or before
    expect(fixedForPeriod(all, septemberPayments, inUse, true).map((f) => f.id)).toEqual([
      'rent',
      'gym',
    ])
  })
})

describe('buildFixedOverview with due days', () => {
  const rent = { ...fixed('Alquiler', 500000), dueDay: 10 }
  const internet = { ...fixed('Internet', 20000), dueDay: 31 }
  const gym = fixed('Gimnasio', 30000) // no due day

  it('counts the days left from today, and puts the most urgent first', () => {
    const today = new Date(2026, 8, 12, 23, 30) // September 12th, late at night
    const { pending } = buildFixedOverview(
      [gym, internet, rent],
      [],
      {},
      {
        period: '2026-09',
        today,
      },
    )
    expect(pending.map((l) => l.fixed.name)).toEqual(['Alquiler', 'Internet', 'Gimnasio'])
    expect(pending[0].due).toEqual({ day: 10, daysLeft: -2 })
    expect(pending[1].due).toEqual({ day: 30, daysLeft: 18 }) // September has 30 days
    expect(pending[2].due).toBeUndefined()
  })

  it('says nothing about the ones already paid', () => {
    const { paid } = buildFixedOverview(
      [rent],
      [payment('Alquiler', 500000, '2026-09-05T12:00:00.000Z')],
      {},
      { period: '2026-09', today: new Date(2026, 8, 20) },
    )
    expect(paid[0].due).toBeUndefined()
  })
})

describe('dueIn', () => {
  it('works across months and years', () => {
    expect(dueIn('2026-10', 1, new Date(2026, 8, 30))).toEqual({ day: 1, daysLeft: 1 })
    expect(dueIn('2026-12', 31, new Date(2027, 0, 1))).toEqual({ day: 31, daysLeft: -1 })
    expect(dueIn('2027-02', 31, new Date(2027, 1, 28))).toEqual({ day: 28, daysLeft: 0 })
  })
})
