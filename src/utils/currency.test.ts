import { describe, expect, it } from 'vitest'
import {
  amountToInput,
  formatAmountInput,
  formatCurrency,
  formatCurrencyCompact,
  formatCurrencyShort,
  MAX_AMOUNT,
  parseAmount,
  splitCurrency,
} from './currency'

describe('dollars', () => {
  it('format as US$ with the Argentine separators', () => {
    expect(formatCurrency(1234.5, 'USD')).toMatch(/^US\$\s1\.234,50$/)
    const { whole, fraction } = splitCurrency(50, 'USD')
    expect(whole).toMatch(/^US\$\s50$/)
    expect(fraction).toBe(',00')
  })

  it('short format drops only zero cents', () => {
    expect(formatCurrencyShort(15, 'USD')).toMatch(/^US\$\s15$/)
    expect(formatCurrencyShort(15.99, 'USD')).toMatch(/^US\$\s15,99$/)
  })
})

describe('formatCurrencyShort', () => {
  it('drops the cents of whole amounts', () => {
    expect(formatCurrencyShort(30000)).toBe(formatCurrency(30000).replace(',00', ''))
    expect(formatCurrencyShort(30000)).not.toContain(',')
  })

  it('keeps real cents', () => {
    expect(formatCurrencyShort(1500.5)).toBe(formatCurrency(1500.5))
  })

  it('abbreviates from a million on', () => {
    expect(formatCurrencyShort(38_888_888)).toBe('$ 38,9 M')
  })
})

describe('formatCurrencyCompact', () => {
  it.each([
    [999_999, formatCurrencyShort(999_999)], // not rounded up to "1 M"
    [1_000_000, '$ 1 M'],
    [1_234_567, '$ 1,2 M'],
    [456_789_123.45, '$ 457 M'],
    [1_617_900_233.21, '$ 1.618 M'],
    [-2_500_000, '-$ 2,5 M'],
  ])('%d → %s', (amount, expected) => {
    expect(formatCurrencyCompact(amount)).toBe(expected)
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
    ['12.500', 12500],
    ['1.500,50', 1500.5],
    ['1500,5', 1500.5],
    [' 200 ', 200],
    ['999.999.999.999,99', MAX_AMOUNT],
  ])('%j → %d', (text, expected) => {
    expect(parseAmount(text)).toBe(expected)
  })

  it.each(['', 'abc', '0', '-50', 'Infinity', '1,234', '1.000.000.000.000'])(
    '%j is not a valid amount',
    (text) => {
      expect(parseAmount(text)).toBeNull()
    },
  )
})

describe('formatAmountInput', () => {
  it.each([
    ['', ''],
    ['12500', '12.500'],
    ['12.500', '12.500'], // already formatted: stable while typing
    ['1234567,891', '1.234.567,89'], // two decimals max
    [',5', '0,5'],
    ['0007', '7'],
    ['12a3$4', '1.234'],
    ['1234567890123456', '123.456.789.012'], // 12 integer digits max
  ])('%j → %j', (text, expected) => {
    expect(formatAmountInput(text)).toBe(expected)
  })

  it('round-trips with parseAmount', () => {
    expect(parseAmount(formatAmountInput('1234567,5'))).toBe(1234567.5)
  })
})

describe('amountToInput', () => {
  it('shows stored amounts the way the input formats them', () => {
    expect(amountToInput(24500)).toBe('24.500')
    expect(amountToInput(1500.5)).toBe('1.500,5')
  })
})
