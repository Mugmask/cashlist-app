const ars = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })
const usd = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' })

// Pesos unless said otherwise; dollars show as "US$ 50"
export type Currency = 'ARS' | 'USD'
const formatters = { ARS: ars, USD: usd }
const usdWhole = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const arsWhole = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})
const millionsOneDecimal = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 })
const millionsWhole = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })

const MILLION = 1_000_000

// The database stores numeric(14, 2): 12 integer digits. Anything bigger would never sync.
export const MAX_AMOUNT = 999_999_999_999.99
const MAX_INTEGER_DIGITS = 12

// "$ 12.500,00", "US$ 50,00"
export function formatCurrency(amount: number, currency: Currency = 'ARS') {
  return formatters[currency].format(amount)
}

// "$ 12.500" for whole amounts, "$ 12.500,50" otherwise: for secondary text, where ",00" is noise.
// From a million on it abbreviates ("$ 38,9 M"), so inline text never blows up the layout.
export function formatCurrencyShort(amount: number, currency: Currency = 'ARS'): string {
  // Dollar amounts here are never millions: only the cents go
  if (currency === 'USD')
    return Number.isInteger(amount) ? usdWhole.format(amount) : usd.format(amount)
  if (Math.abs(amount) >= MILLION) return formatCurrencyCompact(amount)
  return Number.isInteger(amount) ? arsWhole.format(amount) : ars.format(amount)
}

// "$ 38,9 M", "$ 1.618 M". Below a million, the full amount: rounding 999.999 to "1 M" misleads.
export function formatCurrencyCompact(amount: number): string {
  const abs = Math.abs(amount)
  if (abs < MILLION) return formatCurrencyShort(amount)
  const millions = abs / MILLION
  const number = (millions < 100 ? millionsOneDecimal : millionsWhole).format(millions)
  return `${amount < 0 ? '-' : ''}$ ${number} M`
}

// "$815k", "$1,6M", "$900": for chart labels, where a column is a few characters wide
export function formatCurrencyTiny(amount: number): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  if (abs >= MILLION) return `${sign}$${millionsOneDecimal.format(abs / MILLION)}M`
  if (abs >= 1000) return `${sign}$${Math.round(abs / 1000)}k`
  return `${sign}$${Math.round(abs)}`
}

// "$ 12.500,00" → { whole: "$ 12.500", fraction: ",00" }, so the cents can be styled apart
export function splitCurrency(amount: number, currency: Currency = 'ARS') {
  const parts = formatters[currency].formatToParts(amount)
  const decimalIndex = parts.findIndex((p) => p.type === 'decimal')
  const cut = decimalIndex === -1 ? parts.length : decimalIndex
  const join = (list: Intl.NumberFormatPart[]) => list.map((p) => p.value).join('')
  return { whole: join(parts.slice(0, cut)), fraction: join(parts.slice(cut)) }
}

// Reads an amount typed the Argentine way: "." groups thousands, "," is the decimal separator.
// "12.500" → 12500, "1500,5" → 1500.5. Null if it isn't a positive amount within range.
export function parseAmount(text: string) {
  const clean = text.trim().replace(/\./g, '').replace(',', '.')
  if (!/^\d+(\.\d{0,2})?$/.test(clean)) return null
  const value = Number(clean)
  return value > 0 && value <= MAX_AMOUNT ? value : null
}

// Formats what the user is typing: groups thousands and keeps up to two decimals.
// "12500" → "12.500", "12500,5" → "12.500,5". Dots typed by the user are dropped.
export function formatAmountInput(text: string) {
  const clean = text.replace(/[^\d,]/g, '')
  const [rawInteger, ...rest] = clean.split(',')
  const integer = rawInteger.replace(/^0+(?=\d)/, '').slice(0, MAX_INTEGER_DIGITS)
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  if (rest.length === 0) return grouped
  return `${grouped || '0'},${rest.join('').slice(0, 2)}`
}

// A stored amount as the input shows it: 24500 → "24.500", 1500.5 → "1.500,5"
export function amountToInput(amount: number) {
  return formatAmountInput(String(amount).replace('.', ','))
}
