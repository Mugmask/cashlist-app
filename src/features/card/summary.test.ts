import { describe, expect, it } from 'vitest'
import { carryOver } from '@/features/analysis/carryOver'
import type { Card, CardCycle, Expense } from '@/lib/db'
import { buildSchedules, cashParts } from './cycles'
import { cardStatuses, monthPayments, referenceDay } from './summary'

const card = (id: string, name: string): Card => ({
  id,
  name,
  updatedAt: '2026-10-07T12:00:00Z',
  deleted: false,
  pending: 0,
})

const cycle = (cardId: string, closesOn: string, dueOn: string): CardCycle => ({
  id: `${cardId}-${closesOn}`,
  cardId,
  closesOn,
  dueOn,
  updatedAt: '2026-10-07T12:00:00Z',
  deleted: false,
  pending: 0,
})

function expense(amount: number, day: string, patch: Partial<Expense> = {}): Expense {
  const iso = new Date(`${day}T12:00`).toISOString()
  return {
    id: `${day}-${amount}`,
    amount,
    category: 'other',
    spentAt: iso,
    updatedAt: iso,
    deleted: false,
    pending: 0,
    ...patch,
  }
}

const cards = [card('visa', 'Visa Santander'), card('mp', 'Mercado Pago')]
const schedules = buildSchedules([
  cycle('visa', '2026-08-27', '2026-09-04'),
  cycle('visa', '2026-10-01', '2026-10-09'),
  cycle('visa', '2026-10-29', '2026-11-11'),
  cycle('mp', '2026-09-05', '2026-09-10'),
  cycle('mp', '2026-10-05', '2026-10-13'),
])

// A slice of Fran's September and October
const expenses = [
  expense(620_000, '2026-10-05', { name: 'Alquiler', fixedExpenseId: 'rent' }),
  expense(81_995, '2026-08-28', { paymentMethod: 'card', cardId: 'visa', name: 'YPF' }),
  expense(83_000, '2026-09-17', { paymentMethod: 'card', cardId: 'visa', name: 'Cumelcan' }),
  expense(159_999, '2026-09-30', {
    paymentMethod: 'card',
    cardId: 'mp',
    installments: 3,
    name: 'Rack TV',
  }),
  expense(15_000, '2026-10-06', { paymentMethod: 'card', cardId: 'visa', name: 'Nafta' }),
]

describe('monthPayments', () => {
  it("takes cash from its month and each card's statement from the month it's due", () => {
    expect(monthPayments(expenses, '2026-10', cards, schedules)).toEqual({
      total: 620_000 + 81_995 + 83_000 + 53_333,
      cash: 620_000,
      cards: [
        {
          cardId: 'visa',
          name: 'Visa Santander',
          dueOn: '2026-10-09',
          amount: 164_995,
          estimated: false,
        },
        {
          cardId: 'mp',
          name: 'Mercado Pago',
          dueOn: '2026-10-13',
          amount: 53_333,
          estimated: false,
        },
      ],
    })
  })

  it('leaves this month’s card purchases for the statement that pays them', () => {
    const november = monthPayments(expenses, '2026-11', cards, schedules)
    expect(november.cash).toBe(0)
    expect(november.cards.map((p) => [p.name, p.amount])).toEqual([
      ['Visa Santander', 15_000],
      ['Mercado Pago', 53_333],
    ])
  })

  it('names purchases loaded before the user had cards "Tarjeta"', () => {
    const old = expense(1000, '2026-09-10', { paymentMethod: 'card' })
    const payments = monthPayments([old], '2026-10', [], buildSchedules([]))
    expect(payments.cards).toEqual([
      { cardId: '', name: 'Tarjeta', dueOn: '2026-10-10', amount: 1000, estimated: true },
    ])
  })
})

describe('cardStatuses', () => {
  it("shows each card's statement in progress, its dates and the installments after it", () => {
    const [mp, visa] = cardStatuses(expenses, '2026-10-07', cards, schedules)
    expect(visa).toMatchObject({
      name: 'Visa Santander',
      open: { total: 15_000, count: 1, cycle: { closesOn: '2026-10-29', dueOn: '2026-11-11' } },
      later: 0,
    })
    // The rack's 1st installment closed Oct 5th; the 2nd is in progress, the 3rd after it
    expect(mp).toMatchObject({
      name: 'Mercado Pago',
      open: { total: 53_333, count: 1, cycle: { closesOn: '2026-11-05', estimated: true } },
      later: 53_333,
    })
  })

  it('always shows the user\'s cards, and "Tarjeta" only with something on it', () => {
    expect(cardStatuses([], '2026-10-07', cards, schedules).map((s) => s.name)).toEqual([
      'Mercado Pago',
      'Visa Santander',
    ])
    expect(cardStatuses([], '2026-10-07', [], buildSchedules([]))).toEqual([])
  })
})

describe('referenceDay', () => {
  it('is today in the current month and the last day of any other', () => {
    const today = new Date(2026, 9, 7)
    expect(referenceDay('2026-10', today)).toBe('2026-10-07')
    expect(referenceDay('2026-09', today)).toBe('2026-09-30')
  })
})

describe('carry-over by cash', () => {
  it('counts a card purchase in the month its statement is due, not when it was bought', () => {
    const partsOf = (e: Expense) => cashParts(e, cards, schedules)
    const list = [
      expense(500_000, '2026-09-10', { name: 'Alquiler', fixedExpenseId: 'rent' }),
      expense(100_000, '2026-09-20', { paymentMethod: 'card', cardId: 'visa' }), // due Oct 9th
    ]
    // September: 1.000.000 − 500.000; the card is October's
    expect(carryOver(list, 1_000_000, '2026-10', [], partsOf)?.amount).toBe(500_000)
    // By purchase it would have been September's
    expect(carryOver(list, 1_000_000, '2026-10')?.amount).toBe(400_000)
  })
})
