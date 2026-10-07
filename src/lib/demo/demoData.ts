import type {
  Card,
  CardCycle,
  Expense,
  FixedExpense,
  Income,
  PaymentMethod,
  Profile,
  Recipe,
  ShoppingItem,
} from '@/lib/db'
import { toPesos } from '@/lib/exchangeRates'
import { addDays, daysInMonth, shiftMonth, toDayKey, toPeriod } from '@/utils/dates'

// A believable month and a half for local mode (Vercel previews, staging), so every screen has
// something to show. Dates are relative to `now`: this month only up to today, the two before
// in full, so the analysis has months to compare and the card statement has installments.

const DOLLAR_RATE = 1480 // pesos per dollar, about the card's one

export interface DemoData {
  profile: Profile
  expenses: Expense[]
  incomes: Income[]
  fixedExpenses: FixedExpense[]
  shoppingItems: ShoppingItem[]
  recipes: Recipe[]
  cards: Card[]
  cardCycles: CardCycle[]
}

interface VariableExpense {
  day: number
  name: string
  category: string
  amount: number // pesos, or dollars with `usd`
  card?: boolean
  mercadoPago?: boolean // on the second card; the rest of the card ones go on the Visa
  usd?: boolean
  installments?: number
  sharedWith?: number // paid whole, split between this many
}

// Months back from now (0 = this one) → what was spent in it
const VARIABLE: Record<number, VariableExpense[]> = {
  2: [
    { day: 6, name: 'Súper', category: 'groceries', amount: 58_400, card: true },
    {
      day: 14,
      name: 'Heladera',
      category: 'personal',
      amount: 960_000,
      card: true,
      installments: 6,
    },
    { day: 20, name: 'Nafta', category: 'transport', amount: 42_000, card: true },
    { day: 25, name: 'Hamburguesas', category: 'delivery', amount: 24_500 },
  ],
  1: [
    { day: 1, name: 'Súper', category: 'groceries', amount: 63_200, card: true },
    { day: 2, name: 'SUBE', category: 'transport', amount: 15_000 },
    { day: 4, name: 'Pizza', category: 'delivery', amount: 19_800 },
    { day: 6, name: 'Verdulería', category: 'groceries', amount: 11_300 },
    { day: 8, name: 'Farmacia', category: 'personal', amount: 17_600, card: true },
    {
      day: 9,
      name: 'Zapatillas',
      category: 'personal',
      amount: 189_000,
      card: true,
      mercadoPago: true,
      installments: 3,
    },
    { day: 11, name: 'Nafta', category: 'transport', amount: 45_000, card: true },
    {
      day: 13,
      name: 'Sushi',
      category: 'delivery',
      amount: 46_000,
      card: true,
      mercadoPago: true,
      sharedWith: 2,
    },
    { day: 15, name: 'Súper', category: 'groceries', amount: 71_900, card: true },
    { day: 17, name: 'Regalo cumple', category: 'other', amount: 35_000 },
    { day: 19, name: 'Steam', category: 'personal', amount: 15, card: true, usd: true },
    { day: 21, name: 'Verdulería', category: 'groceries', amount: 9_700 },
    { day: 23, name: 'Empanadas', category: 'delivery', amount: 16_400 },
    { day: 25, name: 'Nafta', category: 'transport', amount: 44_000, card: true },
    { day: 27, name: 'Corte de pelo', category: 'personal', amount: 14_000 },
    { day: 28, name: 'Súper', category: 'groceries', amount: 54_300, card: true },
  ],
  0: [
    { day: 1, name: 'Súper', category: 'groceries', amount: 66_800, card: true },
    { day: 2, name: 'SUBE', category: 'transport', amount: 15_000 },
    { day: 3, name: 'Pizza', category: 'delivery', amount: 21_200 },
    { day: 4, name: 'Verdulería', category: 'groceries', amount: 10_900 },
    {
      day: 5,
      name: 'Cena con amigos',
      category: 'delivery',
      amount: 52_000,
      card: true,
      sharedWith: 2,
    },
    { day: 8, name: 'Nafta', category: 'transport', amount: 46_000, card: true },
    { day: 10, name: 'Farmacia', category: 'personal', amount: 12_300 },
    { day: 12, name: 'Súper', category: 'groceries', amount: 59_400, card: true },
    { day: 16, name: 'Hamburguesas', category: 'delivery', amount: 26_100 },
    { day: 20, name: 'Nafta', category: 'transport', amount: 44_500, card: true },
  ],
}

const INCOMES: Record<number, { day: number; name: string; amount: number }[]> = {
  1: [{ day: 18, name: 'Reintegro obra social', amount: 22_000 }],
  0: [{ day: 2, name: 'Venta de la bici', amount: 150_000 }],
}

interface FixedSeed extends Omit<FixedExpense, 'id' | 'updatedAt' | 'deleted' | 'pending'> {
  dueDay: number
}

const FIXED: FixedSeed[] = [
  {
    name: 'Alquiler',
    category: 'rent',
    amount: 900_000,
    shareWith: 2,
    dueDay: 10,
    note: 'CBU 0000003100012345678901 · a nombre de Martín',
  },
  { name: 'Gimnasio', category: 'personal', amount: 32_000, dueDay: 3 },
  { name: 'Netflix', category: 'subscriptions', amount: 10.99, currency: 'USD', dueDay: 5 },
  { name: 'Internet', category: 'utilities', amount: 27_000, paymentMethod: 'card', dueDay: 15 },
  { name: 'Luz', category: 'utilities', amount: 41_000, dueDay: 20, note: 'Cliente N° 4417-2290' },
]

// Like real statements: the Visa closes around the end of the month, a different day every
// month, and Mercado Pago on the 5th. Months back from now (-1: next month's, already announced
// by the last statement) → closing day, as a day of that month (32: the 1st of the next one).
const VISA_CLOSINGS: Record<number, number> = { 3: 28, 2: 30, 1: 32, 0: 29, [-1]: 27 }
const VISA_DUE_DAYS = 9
const MERCADO_PAGO_CLOSING = 5
const MERCADO_PAGO_DUE_DAYS = 8

const SHOPPING: Omit<ShoppingItem, 'id' | 'updatedAt' | 'deleted' | 'pending'>[] = [
  { name: 'Yerba', quantity: 1, status: 'in_stock', timesBought: 7 },
  { name: 'Arroz', quantity: 1, status: 'in_stock', timesBought: 4 },
  { name: 'Aceite', quantity: 1, status: 'in_stock', timesBought: 3 },
  { name: 'Café', quantity: 1, status: 'in_stock', timesBought: 5 },
  { name: 'Leche', quantity: 2, status: 'to_buy', timesBought: 9 },
  { name: 'Pan', quantity: 1, status: 'to_buy', timesBought: 8 },
  { name: 'Tomate', quantity: 4, status: 'to_buy', timesBought: 6 },
  { name: 'Papel higiénico', quantity: 1, status: 'to_buy', timesBought: 3 },
  { name: 'Huevos', quantity: 1, status: 'in_cart', timesBought: 6 },
]

const RECIPES: Recipe['ingredients'][] = [
  [
    { name: 'Fideos', quantity: 1 },
    { name: 'Tomate', quantity: 4 },
    { name: 'Cebolla', quantity: 1 },
    { name: 'Ajo', quantity: 1 },
  ],
  [
    { name: 'Tapa de tarta', quantity: 1 },
    { name: 'Acelga', quantity: 1 },
    { name: 'Huevos', quantity: 3 },
    { name: 'Queso', quantity: 1 },
  ],
]
const RECIPE_NAMES = ['Fideos con tuco', 'Tarta de acelga']

export function buildDemoData(now = new Date()): DemoData {
  const stamp = now.toISOString()
  const base = { updatedAt: stamp, deleted: false, pending: 0 as const }
  const record = <T extends object>(fields: T) => ({ id: crypto.randomUUID(), ...base, ...fields })

  // A day of the month `monthsBack` ago, at midday; null when it hasn't come yet
  const dayOf = (monthsBack: number, day: number) => {
    const month = shiftMonth(now, -monthsBack)
    const date = new Date(
      month.getFullYear(),
      month.getMonth(),
      Math.min(day, daysInMonth(month)),
      13,
    )
    return date <= now ? date.toISOString() : null
  }

  // A day `monthsBack` months ago as a day key, whether it came or not; a day past the month's
  // end is in the next one
  const dayKeyOf = (monthsBack: number, day: number) => {
    const month = shiftMonth(now, -monthsBack)
    return addDays(toDayKey(month), day - 1)
  }
  const visa = record({ name: 'Visa' })
  const mercadoPago = record({ name: 'Mercado Pago' })
  const cardCycles: CardCycle[] = [-1, 0, 1, 2, 3].flatMap((back) => {
    const visaClosing = dayKeyOf(back, VISA_CLOSINGS[back])
    const mpClosing = dayKeyOf(back, MERCADO_PAGO_CLOSING)
    return [
      record({
        cardId: visa.id,
        closesOn: visaClosing,
        dueOn: addDays(visaClosing, VISA_DUE_DAYS),
      }),
      record({
        cardId: mercadoPago.id,
        closesOn: mpClosing,
        dueOn: addDays(mpClosing, MERCADO_PAGO_DUE_DAYS),
      }),
    ]
  })

  const expenses: Expense[] = []
  for (const [back, list] of Object.entries(VARIABLE)) {
    for (const seed of list) {
      const spentAt = dayOf(Number(back), seed.day)
      if (!spentAt) continue
      const paymentMethod: PaymentMethod = seed.card ? 'card' : 'cash'
      const mine = seed.sharedWith ? seed.amount / seed.sharedWith : seed.amount
      expenses.push(
        record<Omit<Expense, keyof typeof base | 'id'>>({
          name: seed.name,
          category: seed.category,
          spentAt,
          paymentMethod,
          ...(seed.usd
            ? {
                amount: toPesos(mine, DOLLAR_RATE),
                currency: 'USD' as const,
                foreignAmount: mine,
                exchangeRate: DOLLAR_RATE,
                exchangeRateKind: 'tarjeta' as const,
              }
            : { amount: mine }),
          ...(seed.sharedWith && { sharedTotal: seed.amount }),
          ...(seed.installments && { installments: seed.installments }),
          ...(seed.card && { cardId: seed.mercadoPago ? mercadoPago.id : visa.id }),
        }),
      )
    }
  }

  // Every fixed expense paid on its due day, this month only the ones already due
  const fixedExpenses = FIXED.map((seed) => record<FixedSeed>(seed))
  for (const fixed of fixedExpenses) {
    for (const back of [2, 1, 0]) {
      const spentAt = dayOf(back, fixed.dueDay!)
      if (!spentAt) continue
      const whole = fixed.shareWith ? fixed.amount / fixed.shareWith : fixed.amount
      expenses.push(
        record<Omit<Expense, keyof typeof base | 'id'>>({
          name: fixed.name,
          category: fixed.category,
          spentAt,
          fixedExpenseId: fixed.id,
          fixedPeriod: toPeriod(shiftMonth(now, -back)),
          paymentMethod: fixed.paymentMethod ?? 'cash',
          ...(fixed.paymentMethod === 'card' && { cardId: visa.id }),
          ...(fixed.currency === 'USD'
            ? {
                amount: toPesos(whole, DOLLAR_RATE),
                currency: 'USD' as const,
                foreignAmount: whole,
                exchangeRate: DOLLAR_RATE,
                exchangeRateKind: 'tarjeta' as const,
              }
            : { amount: whole }),
          ...(fixed.shareWith && { sharedTotal: fixed.amount }),
        }),
      )
    }
  }

  const incomes: Income[] = []
  for (const [back, list] of Object.entries(INCOMES)) {
    for (const seed of list) {
      const receivedAt = dayOf(Number(back), seed.day)
      if (receivedAt) incomes.push(record({ name: seed.name, amount: seed.amount, receivedAt }))
    }
  }

  const lastBoughtAt = dayOf(1, 20)!
  const shoppingItems = SHOPPING.map((seed) => record({ ...seed, lastBoughtAt }))
  const recipes = RECIPES.map((ingredients, i) => record({ name: RECIPE_NAMES[i], ingredients }))

  return {
    profile: { id: 'me', ...base, name: 'Alex', monthlyIncome: 1_900_000 },
    expenses,
    incomes,
    fixedExpenses,
    shoppingItems,
    recipes,
    cards: [visa, mercadoPago],
    cardCycles,
  }
}
