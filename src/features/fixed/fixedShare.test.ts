import { describe, expect, it } from 'vitest'
import { myPartOf, shareFields, shareInput, shareLabel } from './fixedShare'

describe('myPartOf', () => {
  it('follows the bill when split evenly, and stays put when it is an exact part', () => {
    expect(myPartOf({}, 650000)).toBe(650000)
    expect(myPartOf({ shareWith: 2 }, 650000)).toBe(325000)
    expect(myPartOf({ shareWith: 3 }, 100)).toBe(33.33)
    expect(myPartOf({ sharePart: 300000 }, 700000)).toBe(300000)
  })
})

describe('shareLabel', () => {
  it('names the split', () => {
    expect(shareLabel({})).toBeNull()
    expect(shareLabel({ shareWith: 2 })).toBe('A medias')
    expect(shareLabel({ shareWith: 4 })).toBe('Entre 4')
    expect(shareLabel({ sharePart: 300000 })).toBe('Compartido')
  })
})

describe('shareInput and shareFields', () => {
  it('round-trip what the form shows and saves', () => {
    expect(shareInput(undefined)).toEqual({ share: '1', part: '' })
    expect(shareInput({ shareWith: 3 })).toEqual({ share: '3', part: '' })
    expect(shareInput({ sharePart: 300000 })).toEqual({ share: 'part', part: '300.000' })
    expect(shareFields('1', null)).toEqual({ shareWith: undefined, sharePart: undefined })
    expect(shareFields('2', null)).toEqual({ shareWith: 2, sharePart: undefined })
    expect(shareFields('part', 300000)).toEqual({ shareWith: undefined, sharePart: 300000 })
  })
})
