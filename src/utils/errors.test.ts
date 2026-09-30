import { describe, expect, it } from 'vitest'
import { getErrorMessage } from './errors'

describe('getErrorMessage', () => {
  it('reads Error instances', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom')
  })

  it('reads plain objects with a message, like Supabase errors', () => {
    expect(getErrorMessage({ message: 'JWT expired', code: 'PGRST301' })).toBe('JWT expired')
  })

  it('falls back to String() for anything else', () => {
    expect(getErrorMessage('offline')).toBe('offline')
    expect(getErrorMessage(null)).toBe('null')
  })
})
