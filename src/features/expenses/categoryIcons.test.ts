import { describe, expect, it } from 'vitest'
import { shownCustomColor } from './categoryIcons'

describe('shownCustomColor', () => {
  it('is the color as is on the dark theme, 18% darker on the light one', () => {
    expect(shownCustomColor('#ff8000', 'dark')).toBe('#ff8000')
    expect(shownCustomColor('#ff8000', 'light')).toBe('#d16900')
  })
})
