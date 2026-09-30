import { describe, expect, it } from 'vitest'
import {
  daysInMonth,
  formatDayHeading,
  formatDaysAgo,
  formatFullDateTime,
  fromPeriod,
  shiftMonth,
  startOfMonth,
  toDayKey,
  toPeriod,
  withDayKey,
} from './dates'

describe('shiftMonth', () => {
  it('moves whole months, across years, landing on day 1', () => {
    expect(shiftMonth(new Date(2026, 0, 31), -1)).toEqual(new Date(2025, 11, 1))
    expect(shiftMonth(new Date(2026, 11, 15), 1)).toEqual(new Date(2027, 0, 1))
  })
})

describe('toPeriod / daysInMonth', () => {
  it('uses the local calendar month', () => {
    expect(toPeriod(new Date(2026, 0, 31, 23, 59))).toBe('2026-01')
    expect(toPeriod(new Date(2026, 11, 1))).toBe('2026-12')
  })

  it('knows short months', () => {
    expect(daysInMonth(new Date(2026, 1, 10))).toBe(28)
    expect(daysInMonth(new Date(2028, 1, 10))).toBe(29)
    expect(daysInMonth(new Date(2026, 8, 1))).toBe(30)
  })
})

describe('formatDaysAgo', () => {
  const now = new Date(2026, 8, 30, 9, 0)
  const at = (month: number, day: number, hour = 22) =>
    new Date(2026, month, day, hour).toISOString()

  it.each([
    [at(8, 30, 1), 'hoy'],
    [at(8, 29), 'ayer'], // late yesterday is still "ayer", by calendar day
    [at(8, 25), 'hace 5 días'],
    [at(8, 9), 'hace 3 semanas'],
    [at(6, 15), 'hace 2 meses'],
  ])('%s → %s', (iso, expected) => {
    expect(formatDaysAgo(iso, now)).toBe(expected)
  })
})

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

describe('formatFullDateTime', () => {
  it('reads as a full local date with the time', () => {
    const text = formatFullDateTime(new Date(2026, 8, 28, 9, 5).toISOString())
    expect(text).toMatch(/^Lunes/)
    expect(text).toContain('28 de septiembre de 2026')
    expect(text).toContain('09:05')
    expect(formatFullDateTime(new Date(2026, 8, 28, 20, 31).toISOString())).toMatch(/20:31$/)
  })
})

describe('withDayKey', () => {
  it('moves to another local day keeping the time', () => {
    const moved = new Date(withDayKey(new Date(2026, 8, 30, 21, 45).toISOString(), '2026-09-02'))
    expect(toDayKey(moved)).toBe('2026-09-02')
    expect([moved.getHours(), moved.getMinutes()]).toEqual([21, 45])
  })
})

describe('fromPeriod', () => {
  it('is the first local day of the month', () => {
    expect(fromPeriod('2026-09')).toEqual(new Date(2026, 8, 1))
    expect(toPeriod(fromPeriod('2026-12'))).toBe('2026-12')
  })
})
