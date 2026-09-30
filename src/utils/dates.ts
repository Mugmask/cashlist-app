const shortDay = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' })

export function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

// "30 sept"
export function formatShortDay(iso: string) {
  return shortDay.format(new Date(iso))
}
