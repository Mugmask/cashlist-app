import { describe, expect, it } from 'vitest'
import {
  getErrorMessage,
  loginErrorMessage,
  passwordErrorMessage,
  syncErrorMessage,
} from './errors'

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

describe('loginErrorMessage', () => {
  it.each([
    [
      { message: 'Invalid login credentials', code: 'invalid_credentials', status: 400 },
      /no coinciden/,
    ],
    [{ message: 'Email not confirmed', code: 'email_not_confirmed' }, /confirmar tu email/],
    [{ message: 'Request rate limit reached', status: 429 }, /demasiados intentos/],
    [new TypeError('Failed to fetch'), /No hay conexión/], // Chrome
    [new TypeError('Load failed'), /No hay conexión/], // Safari
    [{ message: 'something new' }, /No pudimos iniciar sesión/],
  ])('%j → %s', (error, expected) => {
    expect(loginErrorMessage(error)).toMatch(expected)
  })
})

describe('syncErrorMessage', () => {
  it.each([
    [new TypeError('NetworkError when attempting to fetch resource.'), /No hay conexión/], // Firefox
    [{ message: 'JWT expired', code: 'PGRST301' }, /sesión venció/],
    [{ message: 'JWT cryptographic operation failed', code: 'PGRST301' }, /sesión venció/],
    [{ message: 'duplicate key', code: '23505' }, /No se pudo sincronizar/],
  ])('%j → %s', (error, expected) => {
    expect(syncErrorMessage(error)).toMatch(expected)
  })

  it('always reassures that changes are kept, except when the session must be renewed', () => {
    expect(syncErrorMessage(new TypeError('Failed to fetch'))).toMatch(/quedan guardados/)
    expect(syncErrorMessage({ code: '23505', message: 'x' })).toMatch(/quedan guardados/)
  })
})

describe('passwordErrorMessage', () => {
  it('explains what Supabase refused, in Spanish', () => {
    expect(passwordErrorMessage({ code: 'same_password', message: 'x' })).toBe(
      'Es la misma contraseña que ya tenés.',
    )
    expect(passwordErrorMessage({ code: 'weak_password', message: 'x' })).toMatch(/fácil/)
    expect(passwordErrorMessage(new TypeError('Failed to fetch'))).toMatch(/internet/)
  })
})
