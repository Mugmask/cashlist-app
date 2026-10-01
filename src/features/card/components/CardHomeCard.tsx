import { ChevronRight, CreditCard } from 'lucide-react'
import { Link } from 'react-router'
import { useMonth } from '@/features/month'
import { Amount, Card } from '@/ui'
import { formatMonthName } from '@/utils/dates'
import { useCardSummary } from '../useCardSummary'
import styles from './CardHomeCard.module.css'

// What's on the credit card this month, and the installments still to come. It leads to the
// month's card expenses. Hidden for anyone who doesn't use a card.
export function CardHomeCard() {
  const { month } = useMonth()
  const summary = useCardSummary(month)

  if (!summary) return null

  const { current, upcoming } = summary
  if (current.total === 0 && upcoming === 0) return null

  return (
    <Link to="/expenses?pago=tarjeta" className={styles.link}>
      <Card as="section" aria-labelledby="card-summary-title">
        <header className={styles.header}>
          <span className={styles.icon} aria-hidden>
            <CreditCard />
          </span>
          <h2 id="card-summary-title" className={styles.title}>
            Tarjeta de crédito
          </h2>
          <ChevronRight aria-hidden className={styles.chevron} />
        </header>

        <div className={styles.line}>
          <span className={styles.label}>Acumulado en {formatMonthName(month)}</span>
          <Amount value={current.total} size="lg" />
        </div>

        {upcoming > 0 && (
          <div className={styles.line}>
            <span className={styles.label}>Cuotas que siguen</span>
            <Amount value={upcoming} size="sm" tone="muted" />
          </div>
        )}
      </Card>
    </Link>
  )
}
