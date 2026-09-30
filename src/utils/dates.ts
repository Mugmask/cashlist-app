const shortDay = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' })
const longDay = new Intl.DateTimeFormat('es-AR', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
})
const monthName = new Intl.DateTimeFormat('es-AR', { month: 'long' })

export function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

// Local calendar day as "2026-09-30", for grouping
export function toDayKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

// "30 sept"
export function formatShortDay(iso: string) {
  return shortDay.format(new Date(iso))
}

// "Hoy", "Ayer" or "lunes, 28 sept"
export function formatDayHeading(iso: string, now = new Date()) {
  const key = toDayKey(new Date(iso))
  if (key === toDayKey(now)) return 'Hoy'
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  if (key === toDayKey(yesterday)) return 'Ayer'
  const text = longDay.format(new Date(iso))
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// "septiembre"
export function formatMonthName(date = new Date()) {
  return monthName.format(date)
}
