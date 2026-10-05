import { describe, expect, it } from 'vitest'
import { dueLabel } from './dueLabel'

describe('dueLabel', () => {
  it('warns as the day comes and turns to danger once it goes by', () => {
    expect(dueLabel({ day: 20, daysLeft: 8 })).toEqual({ text: 'Vence el 20', tone: 'muted' })
    expect(dueLabel({ day: 15, daysLeft: 3 })).toEqual({ text: 'Vence en 3 días', tone: 'warning' })
    expect(dueLabel({ day: 13, daysLeft: 1 })).toEqual({ text: 'Vence mañana', tone: 'warning' })
    expect(dueLabel({ day: 12, daysLeft: 0 })).toEqual({ text: 'Vence hoy', tone: 'warning' })
    expect(dueLabel({ day: 11, daysLeft: -1 })).toEqual({ text: 'Venció ayer', tone: 'danger' })
    expect(dueLabel({ day: 5, daysLeft: -7 })).toEqual({ text: 'Venció el 5', tone: 'danger' })
  })
})
