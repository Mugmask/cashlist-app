import { formatRate, toPesos } from '@/lib/exchangeRates'
import type { ConversionRate } from '@/lib/useDollarRate'
import { TextField } from '@/ui'
import { formatCurrencyShort } from '@/utils/currency'
import styles from './DollarConversion.module.css'

// Under a dollar amount: the rate ("1 USD = $ 1.560 · dólar blue") and what it all comes to
// in pesos. Plain text, so it reads (and copies) once.
export function ConversionNote({
  dollars,
  rate,
  loading,
}: {
  dollars: number | null
  rate: ConversionRate | null
  loading: boolean
}) {
  return (
    <p className={styles.conversion} aria-live="polite">
      {loading ? (
        'Buscando cotización…'
      ) : rate ? (
        <>
          <span>{formatRate(rate)}</span>
          <span className={styles.total}>
            Total {formatCurrencyShort(toPesos(dollars ?? 0, rate.rate))}
          </span>
        </>
      ) : (
        'Sin conexión: escribí la cotización'
      )}
    </p>
  )
}

// Offline and without a cached rate, the user types it
export function ManualRateField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <TextField
      label="Cotización (pesos por dólar)"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
    />
  )
}
