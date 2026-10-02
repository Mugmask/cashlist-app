import { describe, expect, it } from 'vitest'
import { contrast } from '@/utils/color'
import { customAccent, needsLightening, readableAccent } from './accent'

const BACKGROUND = '#0a0b0d'

describe('customAccent', () => {
  it('writes dark text on the accent, which is always light enough to read', () => {
    expect(customAccent('#2cff8f')).toEqual({ color: '#2cff8f', on: BACKGROUND })
    expect(customAccent('#ffd84d').on).toBe(BACKGROUND)
    expect(customAccent('#1a237e').on).toBe(BACKGROUND)
  })
})

describe('readableAccent', () => {
  it('keeps a color that already reads like the presets', () => {
    expect(needsLightening('#2cff8f')).toBe(false)
    expect(readableAccent('#2cff8f')).toBe('#2cff8f')
  })

  it('lightens a dark one just enough to hold 7:1 on the background', () => {
    expect(needsLightening('#1a237e')).toBe(true)
    const shown = readableAccent('#1a237e')
    expect(contrast(shown, BACKGROUND)).toBeGreaterThanOrEqual(7)
    expect(contrast(readableAccent('#5a6bff'), BACKGROUND)).toBeGreaterThanOrEqual(7)
  })
})
