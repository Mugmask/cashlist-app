import { RATE_LABEL, toPesos } from '@/lib/exchangeRates'
import type { ConversionRate } from '@/lib/useDollarRate'
import { Amount, TextField } from '@/ui'
import styles from './DollarConversion.module.css'

// Under a dollar amount: what it comes to in pesos, and at which rate
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
          <Amount value={toPesos(dollars ?? 0, rate.rate)} size="sm" /> al {RATE_LABEL[rate.kind]}{' '}
          de <Amount value={rate.rate} size="sm" />
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
