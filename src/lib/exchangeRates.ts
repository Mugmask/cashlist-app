import type { ExchangeRateKind, PaymentMethod } from '@/lib/db'
import { formatCurrencyShort, MAX_AMOUNT, type Currency } from '@/utils/currency'

const API = 'https://dolarapi.com/v1/dolares'
const TIMEOUT_MS = 5000
const STORAGE_KEY = 'cashlist:dollar-rates'

export interface DollarRate {
  kind: ExchangeRateKind
  rate: number // pesos per dollar (the selling price)
  at: string // ISO, when dolarapi.com last updated it
}

export const RATE_LABEL: Record<ExchangeRateKind, string> = {
  tarjeta: 'dólar tarjeta',
  blue: 'dólar blue',
  oficial: 'dólar oficial',
}

// "1 USD = $ 1.560 · dólar blue"
export function formatRate(rate: { kind: ExchangeRateKind; rate: number }) {
  return `1 USD = ${formatCurrencyShort(rate.rate)} · ${RATE_LABEL[rate.kind]}`
}

// What a dollar expense costs in pesos: card purchases go at the card dollar, cash at blue
export function rateKindFor(method: PaymentMethod): ExchangeRateKind {
  return method === 'card' ? 'tarjeta' : 'blue'
}

// Today's rate from dolarapi.com. Offline or failing, the last one fetched on this device;
// null if there never was one.
export async function getDollarRate(kind: ExchangeRateKind): Promise<DollarRate | null> {
  try {
    const response = await fetch(`${API}/${kind}`, { signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (!response.ok) throw new Error(`dolarapi ${response.status}`)
    const data: { venta?: unknown; fechaActualizacion?: unknown } = await response.json()
    if (typeof data.venta !== 'number' || data.venta <= 0) throw new Error('dolarapi: no venta')
    const rate: DollarRate = {
      kind,
      rate: data.venta,
      at:
        typeof data.fechaActualizacion === 'string'
          ? data.fechaActualizacion
          : new Date().toISOString(),
    }
    remember(rate)
    return rate
  } catch {
    return readCached(kind)
  }
}

// Pesos for a dollar amount, rounded to cents like every stored amount
// Whether a dollar amount still fits once in pesos: the amounts' columns hold up to
// MAX_AMOUNT, and one that doesn't would make the server refuse every pending expense with it
export function fitsInPesos(dollars: number, rate: number) {
  return toPesos(dollars, rate) <= MAX_AMOUNT
}

export function toPesos(dollars: number, rate: number) {
  return Math.round(dollars * rate * 100) / 100
}

// An amount in one currency, in the other (`to`): at `rate` if given, else today's for how it's
// paid. Null without any rate (offline, never fetched).
export async function convertAmount(
  value: number,
  to: Currency,
  method: PaymentMethod,
  rate?: number,
): Promise<number | null> {
  const r = rate ?? (await getDollarRate(rateKindFor(method)))?.rate
  if (!r) return null
  return to === 'ARS' ? toPesos(value, r) : Math.round((value / r) * 100) / 100
}

// The cache is a convenience: storage may be unavailable (private mode)
function readAll(): Partial<Record<ExchangeRateKind, DollarRate>> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

// The last rate fetched on this device; null if there never was one
export function readCached(kind: ExchangeRateKind) {
  return readAll()[kind] ?? null
}

function remember(rate: DollarRate) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readAll(), [rate.kind]: rate }))
  } catch {
    // not being able to cache it is harmless
  }
}
