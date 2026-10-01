import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { getPaymentsOf } from '@/features/expenses'
import type { Expense } from '@/lib/db'
import { cx } from '@/ui'
import { formatCurrencyShort } from '@/utils/currency'
import { formatShortMonth, fromPeriod } from '@/utils/dates'
import styles from './FixedHistory.module.css'

// The last change of price, only if there was one: "Ago $ 600.000 → Sept $ 620.000 +3%".
// It compares the latest payment with the one before; dollar ones in dollars.
export function FixedHistory({ fixedExpenseId }: { fixedExpenseId: string }) {
  const payments = useLiveQuery(() => getPaymentsOf(fixedExpenseId), [fixedExpenseId])
  const [thisYear] = useState(() => new Date().getFullYear()) // read once: the sheet is short-lived
  const [latest, before] = payments ?? []
  if (!latest || !before) return null

  const sameCurrency = latest.currency === before.currency
  if (sameCurrency && paid(latest) === paid(before)) return null
  // Pesos against dollars says nothing as a percentage
  const percent = sameCurrency
    ? Math.round(((paid(latest) - paid(before)) / paid(before)) * 100)
    : null

  const month = (p: Expense) =>
    p.fixedPeriod ? formatShortMonth(fromPeriod(p.fixedPeriod), thisYear) : ''
  const amount = (p: Expense) => formatCurrencyShort(paid(p), p.currency === 'USD' ? 'USD' : 'ARS')

  return (
    <p className={styles.change}>
      <span>
        {month(before)} {amount(before)}
      </span>
      <span aria-hidden>→</span>
      <span className={styles.latest}>
        {month(latest)} {amount(latest)}
      </span>
      {percent !== null && percent !== 0 && (
        <span className={cx(styles.percent, percent > 0 ? styles.up : styles.down)}>
          {percent > 0 ? '+' : '−'}
          {Math.abs(percent)}%
        </span>
      )}
    </p>
  )
}

function paid(p: Expense) {
  return p.currency === 'USD' ? p.foreignAmount! : p.amount
}
