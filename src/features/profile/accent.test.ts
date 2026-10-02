import { describe, expect, it } from 'vitest'
import { contrast, customAccent, readsOnBackground } from './accent'

describe('contrast', () => {
  it('goes from 1 (same color) to 21 (black on white)', () => {
    expect(contrast('#777777', '#777777')).toBe(1)
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21)
    expect(contrast('#ffffff', '#000000')).toBeCloseTo(21)
  })
})

describe('customAccent', () => {
  it('writes dark text on a light color and white on a dark one', () => {
    expect(customAccent('#2cff8f').on).toBe('#0a0b0d')
    expect(customAccent('#ffd84d').on).toBe('#0a0b0d')
    expect(customAccent('#1a237e').on).toBe('#ffffff')
  })
})

describe('readsOnBackground', () => {
  it('flags colors too dark for text on the dark background', () => {
    expect(readsOnBackground('#2cff8f', 'dark')).toBe(true)
    expect(readsOnBackground('#1a237e', 'dark')).toBe(false)
  })

  it('flags colors too light for text on the light background', () => {
    expect(readsOnBackground('#1a237e', 'light')).toBe(true)
    expect(readsOnBackground('#2cff8f', 'light')).toBe(false)
  })
})
