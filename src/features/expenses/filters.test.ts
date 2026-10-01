import { describe, expect, it } from 'vitest'
import type { Expense } from '@/lib/db'
import { applyFilters, isFiltered, NO_FILTERS, readFilters, writeFilters } from './filters'
import type { MonthExpense } from './installments'

function expense(id: string, patch: Partial<MonthExpense> = {}): MonthExpense {
  const iso = '2026-09-10T12:00:00.000Z'
  const base: Expense = {
    id,
    amount: 1000,
    category: 'delivery',
    spentAt: iso,
    updatedAt: iso,
    deleted: false,
    pending: 0,
  }
  return { ...base, ...patch }
}

const list = [
  expense('pizza', { note: 'PedidosYa · Pizzaluna', paymentMethod: 'card' }),
  expense('super', { category: 'groceries', note: 'Supermercado Ex' }),
  expense('rent', { category: 'rent', note: 'Alquiler', fixedExpenseId: 'f1' }),
  expense('steam', { category: 'other', currency: 'USD', paymentMethod: 'card' }),
  expense('tv', {
    category: 'other',
    paymentMethod: 'card',
    installment: { number: 2, count: 3, total: 3000 },
  }),
]
const ids = (filters: Partial<typeof NO_FILTERS>) =>
  applyFilters(list, { ...NO_FILTERS, ...filters }).map((e) => e.id)

describe('applyFilters', () => {
  it('searches the note and the category, ignoring case and accents', () => {
    expect(ids({ query: 'pedidosya' })).toEqual(['pizza'])
    expect(ids({ query: 'SÚPER' })).toEqual(['super']) // the category label "Súper"
  })

  it('narrows by category, payment method and kind', () => {
    expect(ids({ category: 'other' })).toEqual(['steam', 'tv'])
    expect(ids({ method: 'cash' })).toEqual(['super', 'rent']) // no method means cash
    expect(ids({ kind: 'fixed' })).toEqual(['rent'])
    expect(ids({ kind: 'variable', method: 'card' })).toEqual(['pizza', 'steam', 'tv'])
  })

  it('keeps only pesos, only dollars or only installments', () => {
    expect(ids({ currency: 'ARS' })).toEqual(['pizza', 'super', 'rent', 'tv'])
    expect(ids({ currency: 'USD' })).toEqual(['steam'])
    expect(ids({ installments: true })).toEqual(['tv'])
  })
})

describe('readFilters / writeFilters', () => {
  it('round-trips through the URL, leaving defaults out', () => {
    const filters = {
      ...NO_FILTERS,
      query: 'pedidos',
      method: 'card' as const,
      currency: 'USD' as const,
    }
    const params = writeFilters(filters)
    expect(params.toString()).toBe('q=pedidos&pago=tarjeta&moneda=dolares')
    expect(readFilters(params)).toEqual(filters)
    expect(writeFilters(NO_FILTERS).toString()).toBe('')
    expect(isFiltered(NO_FILTERS)).toBe(false)
  })

  it('ignores values it doesn’t know', () => {
    expect(readFilters(new URLSearchParams('pago=bitcoin&tipo=raro&moneda=yenes'))).toEqual(
      NO_FILTERS,
    )
  })
})
