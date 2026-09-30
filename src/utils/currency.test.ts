import { describe, expect, it } from 'vitest'
import { parseAmount } from './currency'

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
