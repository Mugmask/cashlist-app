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

// First day of the month `offset` months away: -1 = previous month, 1 = next month
export function shiftMonth(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1)
}

// Local calendar month as "2026-09"
export function toPeriod(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
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

const DAY_MS = 86_400_000

// "hoy", "ayer", "hace 5 días", "hace 3 semanas", "hace 2 meses" (by local calendar day)
export function formatDaysAgo(iso: string, now = new Date()) {
  const then = new Date(iso)
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((startOfDay(now) - startOfDay(then)) / DAY_MS)
  if (days <= 0) return 'hoy'
  if (days === 1) return 'ayer'
  if (days < 14) return `hace ${days} días`
  if (days < 60) return `hace ${Math.floor(days / 7)} semanas`
  return `hace ${Math.floor(days / 30)} meses`
}

// "septiembre"
export function formatMonthName(date = new Date()) {
  return monthName.format(date)
}
