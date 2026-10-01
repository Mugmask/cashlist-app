import { useEffect, useState } from 'react'
import type { ExchangeRateKind, PaymentMethod } from '@/lib/db'
import { getDollarRate, rateKindFor, readCached, type DollarRate } from '@/lib/exchangeRates'
import { parseAmount } from '@/utils/currency'

const FRESH_MS = 5 * 60_000

// One fetch per kind every few minutes, shared by every screen: going from one to another
// doesn't fetch it again. One that got nothing (offline, never cached) isn't kept: the next
// screen asks again, so coming back online doesn't mean typing the rate for 5 more minutes.
const recentFetches = new Map<ExchangeRateKind, { at: number; rate: Promise<DollarRate | null> }>()

function fetchRate(kind: ExchangeRateKind) {
  const recent = recentFetches.get(kind)
  if (recent && Date.now() - recent.at < FRESH_MS) return recent.rate
  const entry = { at: Date.now(), rate: getDollarRate(kind) }
  recentFetches.set(kind, entry)
  entry.rate.then((rate) => {
    if (!rate && recentFetches.get(kind) === entry) recentFetches.delete(kind)
  })
  return entry.rate
}

// Today's rate for a dollar, fetched when `kind` is set (null: not needed right now).
// `rate` is null while loading, and also when it couldn't be fetched nor was ever cached.
// `estimate` is `rate`, or while loading the last one fetched on this device: enough for
// totals that would otherwise show without the dollars for a moment and then jump.
export function useDollarRate(kind: ExchangeRateKind | null) {
  const [result, setResult] = useState<{ kind: ExchangeRateKind; rate: DollarRate | null }>()

  useEffect(() => {
    if (!kind) return
    let cancelled = false
    fetchRate(kind).then((rate) => {
      if (!cancelled) setResult({ kind, rate })
    })
    return () => {
      cancelled = true
    }
  }, [kind])

  const current = kind !== null && result?.kind === kind ? result : undefined
  const rate = current?.rate ?? null
  const estimate = current || !kind ? rate : readCached(kind)
  return { rate, estimate, loading: kind !== null && !current }
}

export interface ConversionRate {
  kind: ExchangeRateKind
  rate: number
}

// The rate for a dollar amount paid with `method`, while `enabled`: the `kept` one if given
// (an edited expense keeps its own), else today's, else (offline, never fetched on this
// device) one the user types in `manual`.
export function useConversionRate({
  enabled,
  method,
  kept,
}: {
  enabled: boolean
  method: PaymentMethod
  kept?: ConversionRate | null
}) {
  const [manual, setManual] = useState('')
  const kind = rateKindFor(method)
  const fetched = useDollarRate(enabled && !kept ? kind : null)
  const needsManual = enabled && !kept && !fetched.loading && !fetched.rate
  const typed = parseAmount(manual)

  let rate: ConversionRate | null = null
  if (enabled) {
    if (kept) rate = kept
    else if (fetched.rate) rate = { kind: fetched.rate.kind, rate: fetched.rate.rate }
    else if (needsManual && typed !== null) rate = { kind, rate: typed }
  }

  return { rate, loading: fetched.loading, needsManual, manual, setManual }
}
