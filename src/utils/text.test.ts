import { describe, expect, it } from 'vitest'
import { capitalize, normalizeName } from './text'

describe('normalizeName', () => {
  it('ignores case, accents and extra spaces', () => {
    expect(normalizeName('  Azúcar  Mascabo ')).toBe(normalizeName('azucar mascabo'))
  })
})

describe('capitalize', () => {
  it('uppercases only the first letter', () => {
    expect(capitalize('ñoquis de papa')).toBe('Ñoquis de papa')
  })
})
