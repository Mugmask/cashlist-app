import { describe, expect, it } from 'vitest'
import { formatCurrency, formatCurrencyShort, parseAmount, splitCurrency } from './currency'

describe('formatCurrencyShort', () => {
  it('drops the cents of whole amounts', () => {
    expect(formatCurrencyShort(30000)).toBe(formatCurrency(30000).replace(',00', ''))
    expect(formatCurrencyShort(30000)).not.toContain(',')
  })

  it('keeps real cents', () => {
    expect(formatCurrencyShort(1500.5)).toBe(formatCurrency(1500.5))
  })
})

describe('splitCurrency', () => {
  it.each([12500, 1500.5, 0, 999999.99])('%d splits into whole + fraction that rejoin', (n) => {
    const { whole, fraction } = splitCurrency(n)
    expect(whole + fraction).toBe(formatCurrency(n))
    expect(fraction).toMatch(/^,\d{2}$/)
    expect(whole).not.toContain(',')
  })
})

describe('parseAmount', () => {
  it.each([
    ['1500', 1500],
    ['1500,50', 1500.5],
    ['1500.50', 1500.5],
    [' 200 ', 200],
  ])('%j → %d', (text, expected) => {
    expect(parseAmount(text)).toBe(expected)
  })

  it.each(['', 'abc', '0', '-50', 'Infinity'])('%j is not a valid amount', (text) => {
    expect(parseAmount(text)).toBeNull()
  })
})
