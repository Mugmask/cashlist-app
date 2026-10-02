import { describe, expect, it } from 'vitest'
import { colorDistance, contrast } from './color'

describe('contrast', () => {
  it('goes from 1 (same color) to 21 (black on white)', () => {
    expect(contrast('#777777', '#777777')).toBe(1)
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21)
    expect(contrast('#ffffff', '#000000')).toBeCloseTo(21)
  })
})

describe('colorDistance', () => {
  it('is 0 for the same color and grows as they look apart', () => {
    expect(colorDistance('#3692fe', '#3692fe')).toBe(0)
    const near = colorDistance('#3692fe', '#3a8ff8') // two blues hard to tell apart
    const far = colorDistance('#3692fe', '#f45602') // blue and orange
    expect(near).toBeLessThan(0.05)
    expect(far).toBeGreaterThan(0.2)
  })
})
