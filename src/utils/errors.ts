// Readable message for anything thrown. Supabase errors are plain objects with a `message`,
// not Error instances, so String(error) would print "[object Object]".
export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message)
  }
  return String(error)
}

function field(error: unknown, key: 'code' | 'status') {
  return typeof error === 'object' && error !== null && key in error
    ? String((error as Record<string, unknown>)[key])
    : undefined
}

// fetch() failing to reach the server, as each browser words it
const NETWORK_MESSAGES = [
  'failed to fetch',
  'load failed',
  'networkerror',
  'network request failed',
]

export function isNetworkError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase()
  return NETWORK_MESSAGES.some((m) => message.includes(m))
}

// The session token was rejected (expired, revoked, or not valid for this project)
export function isAuthError(error: unknown) {
  const code = field(error, 'code')
  const message = getErrorMessage(error).toLowerCase()
  return (
    code === 'PGRST301' ||
    code === 'PGRST303' ||
    field(error, 'status') === '401' ||
    message.includes('jwt')
  )
}

export function isRateLimited(error: unknown) {
  return field(error, 'status') === '429' || field(error, 'code') === 'over_request_rate_limit'
}

// Spanish, actionable copy for errors shown to the user. The raw error still goes to the console.
export function loginErrorMessage(error: unknown) {
  const code = field(error, 'code')
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(getErrorMessage(error))) {
    return 'El email o la contraseña no coinciden.'
  }
  if (code === 'email_not_confirmed') return 'Tenés que confirmar tu email antes de entrar.'
  if (isRateLimited(error)) return 'Hubo demasiados intentos. Esperá un minuto y probá de nuevo.'
  if (isNetworkError(error)) return 'No hay conexión. Revisá tu internet y probá de nuevo.'
  return 'No pudimos iniciar sesión. Probá de nuevo en un rato.'
}

export function syncErrorMessage(error: unknown) {
  if (isNetworkError(error)) {
    return 'No hay conexión con el servidor. Tus cambios quedan guardados en este dispositivo y se suben solos cuando vuelva.'
  }
  if (isAuthError(error)) {
    return 'Tu sesión venció. Cerrá sesión y volvé a entrar para seguir sincronizando.'
  }
  return 'No se pudo sincronizar. Tus cambios quedan guardados en este dispositivo y se reintenta solo.'
}
