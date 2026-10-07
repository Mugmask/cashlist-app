import type { Card, Expense } from '@/lib/db'
import { lastDayOf, toDayKey } from '@/utils/dates'
import { cardIdOf, cashParts, chargesOf, type Cycle, type Schedules } from './cycles'

// The name a card shows: purchases loaded before the user had cards are on "Tarjeta"
export function cardName(cardId: string, cards: readonly Card[]) {
  return cards.find((c) => c.id === cardId)?.name ?? 'Tarjeta'
}

// One card's statement paid in a month
export interface CardPayment {
  cardId: string
  name: string
  dueOn: string
  amount: number // my part of what it charges: what my money pays
  estimated: boolean
}

// What leaves a month's money (see cashParts): cash, debit and transfers made in it, and the
// card statements due in it
export interface MonthPayments {
  total: number
  cash: number
  cards: CardPayment[] // the one due soonest first
}

// `expenses` must reach back as far as the longest installment plan, and a month more: a
// purchase late in a month is due the next one
export function monthPayments(
  expenses: readonly Expense[],
  period: string,
  cards: readonly Card[],
  schedules: Schedules,
): MonthPayments {
  let cash = 0
  const byCard = new Map<string, CardPayment>()
  for (const e of expenses) {
    if (e.deleted) continue
    for (const part of cashParts(e, cards, schedules)) {
      if (part.period !== period) continue
      if (!part.charge) {
        cash += part.amount
        continue
      }
      const { cardId, cycle } = part.charge
      const payment = byCard.get(cardId) ?? {
        cardId,
        name: cardName(cardId, cards),
        dueOn: cycle.dueOn,
        amount: 0,
        estimated: cycle.estimated,
      }
      payment.amount += part.amount
      byCard.set(cardId, payment)
    }
  }
  const paid = [...byCard.values()]
    .map((p) => ({ ...p, amount: round(p.amount) }))
    .sort((a, b) => a.dueOn.localeCompare(b.dueOn))
  return {
    total: round(cash + paid.reduce((sum, p) => sum + p.amount, 0)),
    cash: round(cash),
    cards: paid,
  }
}

// Where one card stands: the statement it's filling now and what's already on later ones
export interface CardStatus {
  cardId: string
  name: string
  card?: Card // missing for "Tarjeta", the purchases from before the user had cards
  open: { cycle: Cycle; total: number; count: number }
  later: number // installments already on the statements after it
}

// Each card's status as seen from `day` ("2026-10-07"). Totals are what the statements charge:
// the whole bill of a shared purchase. The user's cards always show (their dates are worth
// seeing); "Tarjeta" only while it has something.
export function cardStatuses(
  expenses: readonly Expense[],
  day: string,
  cards: readonly Card[],
  schedules: Schedules,
): CardStatus[] {
  const live = cards.filter((c) => !c.deleted)
  const statuses = new Map<string, CardStatus>()
  const statusOf = (cardId: string) => {
    let status = statuses.get(cardId)
    if (!status) {
      status = {
        cardId,
        name: cardName(cardId, cards),
        card: cards.find((c) => c.id === cardId),
        open: { cycle: schedules(cardId).cycleOf(day), total: 0, count: 0 },
        later: 0,
      }
      statuses.set(cardId, status)
    }
    return status
  }
  for (const card of live) statusOf(card.id)

  for (const e of expenses) {
    if (e.deleted || e.paymentMethod !== 'card') continue
    for (const charge of chargesOf(e, cards, schedules)) {
      const status = statusOf(cardIdOf(e, cards))
      const { closesOn } = charge.cycle
      if (closesOn === status.open.cycle.closesOn) {
        status.open.total += charge.charged
        status.open.count += 1
      } else if (closesOn > status.open.cycle.closesOn) {
        status.later += charge.charged
      }
    }
  }

  return [...statuses.values()]
    .filter((s) => s.card || s.open.total > 0 || s.later > 0)
    .map((s) => ({
      ...s,
      open: { ...s.open, total: round(s.open.total) },
      later: round(s.later),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

// The day a month is seen from: today in the current one, its last day for any other
export function referenceDay(period: string, today: Date) {
  const todayKey = toDayKey(today)
  return todayKey.slice(0, 7) === period ? todayKey : lastDayOf(period)
}

// Sums of cents in floating point drift (0.1 + 0.2); amounts are kept to the cent
function round(amount: number) {
  return Math.round(amount * 100) / 100
}
