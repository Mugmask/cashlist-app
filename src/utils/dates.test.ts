import { describe, expect, it } from 'vitest'
import { startOfMonth } from './dates'

describe('startOfMonth', () => {
  it('returns day 1 at 00:00 local time', () => {
    const start = startOfMonth(new Date(2026, 8, 30, 18, 45))
    expect(start).toEqual(new Date(2026, 8, 1, 0, 0, 0, 0))
  })

  it('works across a year change', () => {
    expect(startOfMonth(new Date(2027, 0, 1, 0, 5))).toEqual(new Date(2027, 0, 1))
  })
})
