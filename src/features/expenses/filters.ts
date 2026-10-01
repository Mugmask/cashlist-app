import type { PaymentMethod } from '@/lib/db'
import type { Currency } from '@/utils/currency'
import { normalizeName } from '@/utils/text'
import { getCategory } from './categories'
import type { MonthExpense } from './installments'
import { isFixed } from './selectors'

// What the expense list can be narrowed to. Kept in the URL ("?q=pedidos&pago=tarjeta"), so
// back, reload and links (the home's card) all land on the same list.
export interface ExpenseFilters {
  query: string // text in the name, the note or the category's name
  category?: string
  method?: PaymentMethod
  kind?: 'fixed' | 'variable'
  currency?: Currency // only expenses in pesos, or only in dollars
  installments: boolean // only purchases in installments
}

export const NO_FILTERS: ExpenseFilters = { query: '', installments: false }

const METHOD_PARAM: Record<PaymentMethod, string> = { card: 'tarjeta', cash: 'efectivo' }
const KIND_PARAM = { fixed: 'fijos', variable: 'variables' } as const
const CURRENCY_PARAM: Record<Currency, string> = { ARS: 'pesos', USD: 'dolares' }

export function readFilters(params: URLSearchParams): ExpenseFilters {
  const method = (Object.keys(METHOD_PARAM) as PaymentMethod[]).find(
    (m) => METHOD_PARAM[m] === params.get('pago'),
  )
  const kind = (Object.keys(KIND_PARAM) as (keyof typeof KIND_PARAM)[]).find(
    (k) => KIND_PARAM[k] === params.get('tipo'),
  )
  const currency = (Object.keys(CURRENCY_PARAM) as Currency[]).find(
    (c) => CURRENCY_PARAM[c] === params.get('moneda'),
  )
  return {
    query: params.get('q') ?? '',
    category: params.get('cat') ?? undefined,
    method,
    kind,
    currency,
    installments: params.get('cuotas') === '1',
  }
}

// Only what differs from no filter, so a clean list has a clean URL
export function writeFilters(filters: ExpenseFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.query) params.set('q', filters.query)
  if (filters.category) params.set('cat', filters.category)
  if (filters.method) params.set('pago', METHOD_PARAM[filters.method])
  if (filters.kind) params.set('tipo', KIND_PARAM[filters.kind])
  if (filters.currency) params.set('moneda', CURRENCY_PARAM[filters.currency])
  if (filters.installments) params.set('cuotas', '1')
  return params
}

export function isFiltered(filters: ExpenseFilters) {
  return writeFilters(filters).size > 0
}

export function applyFilters<T extends MonthExpense>(
  expenses: readonly T[],
  filters: ExpenseFilters,
): T[] {
  const query = normalizeName(filters.query)
  return expenses.filter(
    (e) =>
      (!query ||
        normalizeName(`${e.name ?? ''} ${e.note ?? ''} ${getCategory(e.category).label}`).includes(
          query,
        )) &&
      // By the category it shows as: one deleted or folded into another counts as that one
      (!filters.category || getCategory(e.category).id === filters.category) &&
      (!filters.method || (e.paymentMethod ?? 'cash') === filters.method) &&
      (!filters.kind || (filters.kind === 'fixed') === isFixed(e)) &&
      (!filters.currency || (e.currency ?? 'ARS') === filters.currency) &&
      (!filters.installments || e.installment !== undefined),
  )
}
