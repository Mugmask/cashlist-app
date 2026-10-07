import { describe, expect, it } from 'vitest'
import type { Card, CardCycle, Expense } from '@/lib/db'
import { buildSchedule, buildSchedules, cardIdOf, cashParts, chargesOf } from './cycles'

const cycle = (cardId: string, closesOn: string, dueOn: string): CardCycle => ({
  id: `${cardId}-${closesOn}`,
  cardId,
  closesOn,
  dueOn,
  updatedAt: '2026-10-07T12:00:00Z',
  deleted: false,
  pending: 0,
})

// Fran's real 2026 statements: Santander moves its closing around, Mercado Pago closes on the 5th
const SANTANDER = [
  cycle('visa', '2026-07-02', '2026-07-13'),
  cycle('visa', '2026-07-30', '2026-08-07'),
  cycle('visa', '2026-08-27', '2026-09-04'),
  cycle('visa', '2026-10-01', '2026-10-09'),
  cycle('visa', '2026-10-29', '2026-11-11'),
]
const MERCADO_PAGO = [
  cycle('mp', '2026-07-05', '2026-07-13'),
  cycle('mp', '2026-08-05', '2026-08-10'),
  cycle('mp', '2026-09-05', '2026-09-10'),
  cycle('mp', '2026-10-05', '2026-10-13'),
]

const card = (id: string, name: string): Card => ({
  id,
  name,
  updatedAt: '2026-10-07T12:00:00Z',
  deleted: false,
  pending: 0,
})

function expense(amount: number, day: string, patch: Partial<Expense> = {}): Expense {
  const iso = new Date(`${day}T12:00`).toISOString()
  return {
    id: day,
    amount,
    category: 'other',
    spentAt: iso,
    updatedAt: iso,
    deleted: false,
    pending: 0,
    paymentMethod: 'card',
    ...patch,
  }
}

describe('buildSchedule', () => {
  it('without statements, closes on the last day of each month and is due 10 days later', () => {
    const schedule = buildSchedule([])
    expect(schedule.cycleOf('2026-09-30')).toEqual({
      closesOn: '2026-09-30',
      dueOn: '2026-10-10',
      end: '2026-09-30',
      estimated: true,
    })
    expect(schedule.cycleOf('2026-10-01').closesOn).toBe('2026-10-31')
    expect(schedule.unsure('2026-09-30')).toBe(false) // nothing known to be unsure about
  })

  it('puts each day in the statement that really took it', () => {
    const schedule = buildSchedule(SANTANDER)
    // Sep 30th went on the statement that closed Oct 1st, paid Oct 9th
    expect(schedule.cycleOf('2026-09-30')).toEqual({
      closesOn: '2026-10-01',
      dueOn: '2026-10-09',
      end: '2026-10-01',
      estimated: false,
    })
    expect(schedule.cycleOf('2026-08-28').closesOn).toBe('2026-10-01')
    expect(schedule.cycleOf('2026-08-27').closesOn).toBe('2026-08-27')
    expect(schedule.cycleOf('2026-07-31').dueOn).toBe('2026-09-04')
  })

  it('estimates the months after the last statement, due the usual days after closing', () => {
    const schedule = buildSchedule(SANTANDER)
    // Closing to due took 11, 8, 8, 8 and 13 days: 8 is the usual
    expect(schedule.cycleOf('2026-10-30')).toEqual({
      closesOn: '2026-11-29',
      dueOn: '2026-12-07',
      end: '2026-12-02',
      estimated: true,
    })
    expect(schedule.cycleOf('2026-12-03').closesOn).toBe('2026-12-29')
  })

  it('puts a purchase around an estimated closing in the earlier statement, and flags it', () => {
    const schedule = buildSchedule(SANTANDER)
    expect(schedule.cycleOf('2026-12-01').closesOn).toBe('2026-11-29')
    expect(schedule.unsure('2026-12-01')).toBe(true)
    expect(schedule.unsure('2026-11-27')).toBe(true)
    expect(schedule.unsure('2026-11-20')).toBe(false)
    // A statement said it: no doubt
    expect(schedule.unsure('2026-10-01')).toBe(false)
  })

  it('estimates the months before the first statement', () => {
    const schedule = buildSchedule(SANTANDER)
    expect(schedule.cycleOf('2026-06-20').closesOn).toBe('2026-07-02')
    expect(schedule.cycleOf('2026-06-04')).toMatchObject({
      closesOn: '2026-06-02',
      estimated: true,
    })
  })

  it('fills a month without a statement between two known ones', () => {
    const schedule = buildSchedule([SANTANDER[0], SANTANDER[4]]) // Jul 2nd and Oct 29th
    expect(schedule.cycleOf('2026-08-15')).toMatchObject({
      closesOn: '2026-09-02',
      estimated: true,
    })
    expect(schedule.cycleOf('2026-10-20')).toMatchObject({
      closesOn: '2026-10-29',
      estimated: false,
    })
  })

  it('keeps the latest edit when two devices typed in the same statement', () => {
    const older = { ...cycle('visa', '2026-10-29', '2026-11-10'), updatedAt: '2026-10-01' }
    const newer = { ...cycle('visa', '2026-10-29', '2026-11-11'), id: 'other' }
    const deleted = { ...cycle('visa', '2026-10-15', '2026-10-20'), deleted: true }
    const schedule = buildSchedule([older, newer, deleted])
    expect(schedule.cycleOf('2026-10-10').dueOn).toBe('2026-11-11')
  })

  it('moves to the next statement', () => {
    const schedule = buildSchedule(MERCADO_PAGO)
    const october = schedule.cycleOf('2026-09-30')
    expect(october.closesOn).toBe('2026-10-05')
    expect(schedule.next(october)).toMatchObject({ closesOn: '2026-11-05', estimated: true })
  })
})

describe('cardIdOf', () => {
  const cards = [card('visa', 'Visa Santander'), card('mp', 'Mercado Pago')]

  it("is the purchase's card, or the first one alphabetically for one without", () => {
    expect(cardIdOf({ cardId: 'visa' }, cards)).toBe('visa')
    expect(cardIdOf({}, cards)).toBe('mp')
    expect(cardIdOf({}, [])).toBe('')
    expect(cardIdOf({}, [{ ...cards[1], deleted: true }, cards[0]])).toBe('visa')
  })
})

describe('chargesOf and cashParts', () => {
  const cards = [card('visa', 'Visa Santander'), card('mp', 'Mercado Pago')]
  const schedules = buildSchedules([...SANTANDER, ...MERCADO_PAGO])

  it('charges each installment on the next statement', () => {
    // The TV rack: 159,999 in 3 on Mercado Pago, Sep 30th
    const rack = expense(159_999, '2026-09-30', { cardId: 'mp', installments: 3 })
    const charges = chargesOf(rack, cards, schedules)
    expect(charges.map((c) => [c.number, c.amount, c.cycle.closesOn, c.cycle.dueOn])).toEqual([
      [1, 53_333, '2026-10-05', '2026-10-13'],
      [2, 53_333, '2026-11-05', '2026-11-13'],
      [3, 53_333, '2026-12-05', '2026-12-13'],
    ])
  })

  it('charges the whole bill of a shared purchase, while my money pays my part', () => {
    const dinner = expense(30_000, '2026-10-10', { cardId: 'visa', sharedTotal: 60_000 })
    const [charge] = chargesOf(dinner, cards, schedules)
    expect(charge).toMatchObject({ amount: 30_000, charged: 60_000 })
  })

  it('takes cash from its own month and card purchases from the month they are due', () => {
    const cash = expense(5000, '2026-09-30', { paymentMethod: 'cash' })
    expect(cashParts(cash, cards, schedules)).toEqual([{ period: '2026-09', amount: 5000 }])
    // On Santander, Sep 30th is paid Oct 9th: October's money
    const card = expense(81_995, '2026-09-30', { cardId: 'visa' })
    expect(cashParts(card, cards, schedules).map((p) => [p.period, p.amount])).toEqual([
      ['2026-10', 81_995],
    ])
  })
})
