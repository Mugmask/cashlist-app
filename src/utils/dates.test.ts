import { describe, expect, it } from 'vitest'
import { formatDayHeading, startOfMonth, toDayKey } from './dates'

describe('startOfMonth', () => {
  it('returns day 1 at 00:00 local time', () => {
    const start = startOfMonth(new Date(2026, 8, 30, 18, 45))
    expect(start).toEqual(new Date(2026, 8, 1, 0, 0, 0, 0))
  })

  it('works across a year change', () => {
    expect(startOfMonth(new Date(2027, 0, 1, 0, 5))).toEqual(new Date(2027, 0, 1))
  })
})

describe('toDayKey', () => {
  it('uses the local calendar day, zero-padded', () => {
    expect(toDayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})

describe('formatDayHeading', () => {
  const now = new Date(2026, 8, 30, 10, 0)

  it('says "Hoy" for any time today', () => {
    expect(formatDayHeading(new Date(2026, 8, 30, 0, 1).toISOString(), now)).toBe('Hoy')
    expect(formatDayHeading(new Date(2026, 8, 30, 23, 59).toISOString(), now)).toBe('Hoy')
  })

  it('says "Ayer" for yesterday, also across a month change', () => {
    expect(formatDayHeading(new Date(2026, 8, 29, 12).toISOString(), now)).toBe('Ayer')
    const firstOfOctober = new Date(2026, 9, 1, 9)
    expect(formatDayHeading(new Date(2026, 8, 30, 21).toISOString(), firstOfOctober)).toBe('Ayer')
  })

  it('uses a capitalized weekday and day for older dates', () => {
    const heading = formatDayHeading(new Date(2026, 8, 28, 12).toISOString(), now)
    expect(heading).toMatch(/^L/) // lunes
    expect(heading).toContain('28')
  })
})
