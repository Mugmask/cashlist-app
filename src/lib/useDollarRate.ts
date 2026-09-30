import { useEffect, useState } from 'react'
import type { ExchangeRateKind, PaymentMethod } from '@/lib/db'
import { getDollarRate, rateKindFor, type DollarRate } from '@/lib/exchangeRates'
import { parseAmount } from '@/utils/currency'

// Today's rate for a dollar, fetched when `kind` is set (null: not needed right now).
// `rate` is null while loading, and also when it couldn't be fetched nor was ever cached.
export function useDollarRate(kind: ExchangeRateKind | null) {
  const [result, setResult] = useState<{ kind: ExchangeRateKind; rate: DollarRate | null }>()

  useEffect(() => {
    if (!kind) return
    let cancelled = false
    getDollarRate(kind).then((rate) => {
      if (!cancelled) setResult({ kind, rate })
    })
    return () => {
      cancelled = true
    }
  }, [kind])

  const current = kind !== null && result?.kind === kind ? result : undefined
  return { rate: current?.rate ?? null, loading: kind !== null && !current }
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
