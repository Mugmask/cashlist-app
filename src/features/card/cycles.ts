import { chargedOf, splitInstallments } from '@/features/expenses'
import type { Card, CardCycle, Expense } from '@/lib/db'
import { addDays, addMonthsToDay, daysBetween, lastDayOf, toDayKey } from '@/utils/dates'

// A card's statement period: purchases after the previous one's end, up to `end`, are paid on
// `dueOn`. Dates are day keys ("2026-10-29").
export interface Cycle {
  closesOn: string
  dueOn: string
  // The last day of purchases it takes: its closing, or a few days past an estimated one (see
  // UNSURE_DAYS)
  end: string
  estimated: boolean // no statement said these dates: they come from the ones known
}

// Banks move the closing a few days every month (Santander closed on Jul 30th, Aug 27th and
// Oct 1st in 2026). Around an estimated closing, a purchase may fall in either statement: it
// goes in the earlier one, paid sooner, which is the safe side for what's left to spend.
export const UNSURE_DAYS = 3
// Days from closing to due when no statement says: about what both of Fran's cards take
const DEFAULT_DUE_DAYS = 10
// Known closings further apart than this have a month without a statement in between
const MISSING_MONTH_DAYS = 45

// Where a day falls in one card's statements
export interface Schedule {
  cycleOf: (dayKey: string) => Cycle
  next: (cycle: Cycle) => Cycle
  // A purchase this day may end up in the next statement: its cycle is estimated and the day
  // is close to its closing
  unsure: (dayKey: string) => boolean
}

// One card's schedule from the cycles known for it. With none, statements close on each
// month's last day, the calendar month, as the app always assumed.
export function buildSchedule(cycles: readonly CardCycle[]): Schedule {
  const known = latestByClosing(cycles.filter((c) => !c.deleted))
  const dueDays = median(known.map((c) => daysBetween(c.closesOn, c.dueOn))) ?? DEFAULT_DUE_DAYS

  const estimate = (closesOn: string): Cycle => ({
    closesOn,
    dueOn: addDays(closesOn, dueDays),
    end: addDays(closesOn, UNSURE_DAYS),
    estimated: true,
  })
  const exact = (c: CardCycle): Cycle => ({
    closesOn: c.closesOn,
    dueOn: c.dueOn,
    end: c.closesOn,
    estimated: false,
  })

  function cycleOf(day: string): Cycle {
    if (known.length === 0) {
      const closesOn = lastDayOf(day.slice(0, 7))
      return { closesOn, dueOn: addDays(closesOn, dueDays), end: closesOn, estimated: true }
    }
    const first = known[0]
    const last = known[known.length - 1]
    if (day > last.closesOn) {
      // Monthly after the last one known
      for (let k = 1; ; k++) {
        const cycle = estimate(addMonthsToDay(last.closesOn, k))
        if (day <= cycle.end) return cycle
      }
    }
    if (day <= first.closesOn) {
      // Monthly before the first one known: walk back to the window holding the day
      for (let k = 0; ; k++) {
        const previousEnd = estimate(addMonthsToDay(first.closesOn, -(k + 1))).end
        if (day > previousEnd) {
          return k === 0 ? exact(first) : estimate(addMonthsToDay(first.closesOn, -k))
        }
      }
    }
    // Between two known ones: the later one, or a month estimated in a gap without a statement
    const i = known.findIndex((c) => day <= c.closesOn)
    const before = known[i - 1]
    for (let k = 1; ; k++) {
      const closesOn = addMonthsToDay(before.closesOn, k)
      if (daysBetween(before.closesOn, known[i].closesOn) <= MISSING_MONTH_DAYS) break
      if (daysBetween(closesOn, known[i].closesOn) < MISSING_MONTH_DAYS / 2) break
      const cycle = estimate(closesOn)
      if (day <= cycle.end) return cycle
    }
    return exact(known[i])
  }

  return {
    cycleOf,
    next: (cycle) => cycleOf(addDays(cycle.end, 1)),
    unsure: (day) => {
      const cycle = cycleOf(day)
      return (
        known.length > 0 &&
        cycle.estimated &&
        Math.abs(daysBetween(day, cycle.closesOn)) <= UNSURE_DAYS
      )
    },
  }
}

// Two devices may each have typed in the same statement: the latest edit of each closing wins
function latestByClosing(cycles: readonly CardCycle[]) {
  const byClosing = new Map<string, CardCycle>()
  for (const c of cycles) {
    const seen = byClosing.get(c.closesOn)
    if (!seen || c.updatedAt > seen.updatedAt) byClosing.set(c.closesOn, c)
  }
  return [...byClosing.values()].sort((a, b) => a.closesOn.localeCompare(b.closesOn))
}

function median(values: number[]) {
  if (values.length === 0) return undefined
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

// The card a card purchase went on: its own, or the first card for one loaded before it had
// any (alphabetically, so every device agrees). '' while the user has no cards.
export function cardIdOf(expense: Pick<Expense, 'cardId'>, cards: readonly Card[]) {
  if (expense.cardId) return expense.cardId
  const first = cards
    .filter((c) => !c.deleted)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))[0]
  return first?.id ?? ''
}

// Every card's schedule, looked up by card id ('' is the purchases without a card)
export function buildSchedules(cycles: readonly CardCycle[]) {
  const byCard = new Map<string, CardCycle[]>()
  for (const c of cycles) byCard.set(c.cardId, [...(byCard.get(c.cardId) ?? []), c])
  const schedules = new Map<string, Schedule>()
  return (cardId: string) => {
    let schedule = schedules.get(cardId)
    if (!schedule) {
      schedule = buildSchedule(byCard.get(cardId) ?? [])
      schedules.set(cardId, schedule)
    }
    return schedule
  }
}

export type Schedules = ReturnType<typeof buildSchedules>

// One installment of a card purchase (the whole purchase when it's in one payment) and the
// statement that charges it
export interface CardCharge {
  expense: Expense
  cardId: string
  number: number // 1-based
  count: number
  amount: number // my part of this installment: what my money pays
  charged: number // what the statement charges for it: the whole bill when shared
  cycle: Cycle
}

// The statements a card purchase is charged on: the first installment on the one its day
// falls in, each next installment on the next statement
export function chargesOf(
  expense: Expense,
  cards: readonly Card[],
  schedules: Schedules,
): CardCharge[] {
  const cardId = cardIdOf(expense, cards)
  const schedule = schedules(cardId)
  const count = expense.installments ?? 1
  const mine = splitInstallments(expense.amount, count)
  const charged = splitInstallments(chargedOf(expense), count)
  const charges: CardCharge[] = []
  let cycle = schedule.cycleOf(toDayKey(new Date(expense.spentAt)))
  for (let i = 0; i < count; i++) {
    if (i > 0) cycle = schedule.next(cycle)
    charges.push({
      expense,
      cardId,
      number: i + 1,
      count,
      amount: mine[i],
      charged: charged[i],
      cycle,
    })
  }
  return charges
}

// What an expense takes from each month's money ("2026-10"): cash, debit and transfers the
// month they happened; a card purchase, each installment the month its statement is due
export function cashParts(
  expense: Expense,
  cards: readonly Card[],
  schedules: Schedules,
): { period: string; amount: number; charge?: CardCharge }[] {
  if (expense.paymentMethod !== 'card') {
    return [{ period: toDayKey(new Date(expense.spentAt)).slice(0, 7), amount: expense.amount }]
  }
  return chargesOf(expense, cards, schedules).map((charge) => ({
    period: charge.cycle.dueOn.slice(0, 7),
    amount: charge.amount,
    charge,
  }))
}
