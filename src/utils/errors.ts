// Readable message for anything thrown. Supabase errors are plain objects with a `message`,
// not Error instances, so String(error) would print "[object Object]".
export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message)
  }
  return String(error)
}
