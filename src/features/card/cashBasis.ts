import type { Expense } from '@/lib/db'
import { cardsRepo } from './cardsRepo'
import { buildSchedules, cashParts } from './cycles'
import { monthPayments } from './summary'

// What the balance needs to count by cash (see cashParts): each expense's parts by month, and
// what leaves a given month. Reads the database: for live queries.
export async function getCashBasis() {
  const { cards, cycles } = await cardsRepo.all()
  const schedules = buildSchedules(cycles)
  return {
    partsOf: (e: Expense) => cashParts(e, cards, schedules),
    paymentsIn: (expenses: readonly Expense[], period: string) =>
      monthPayments(expenses, period, cards, schedules),
  }
}
