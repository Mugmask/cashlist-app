import { describe, expect, it } from 'vitest'
import { describeChange } from './insight'

describe('describeChange', () => {
  it('says how the day to day goes against the month before', () => {
    expect(describeChange(-0.12, 'agosto', true)).toBe('En el día a día vas 12% abajo de agosto')
    expect(describeChange(0.3, 'agosto', false)).toBe('En el día a día fuiste 30% arriba de agosto')
  })

  it('calls a tiny difference even, and says nothing without data', () => {
    expect(describeChange(0.02, 'agosto', true)).toBe('En el día a día vas parejo con agosto')
    expect(describeChange(null, 'agosto', true)).toBeNull()
  })
})
