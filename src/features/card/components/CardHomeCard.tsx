import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { useMonth } from '@/features/month'
import { Amount, Card } from '@/ui'
import { formatCurrencyShort } from '@/utils/currency'
import { formatMonthName } from '@/utils/dates'
import type { CardSummary } from '../useCardSummary'
import styles from './CardHomeCard.module.css'

// What's on the credit card this month, a small tile on home, and the installments still to
// come. It leads to the month's card expenses. Hidden for anyone who doesn't use a card.
export function CardHomeCard({ summary }: { summary: CardSummary }) {
  const { month } = useMonth()
  const { current, upcoming } = summary
  if (current.total === 0 && upcoming === 0) return null

  return (
    <Link to="/expenses?pago=tarjeta" className={styles.link}>
      <Card as="section" className={styles.tile} aria-labelledby="card-tile-title">
        <header className={styles.header}>
          <h2 id="card-tile-title" className={styles.title}>
            Tarjeta
          </h2>
          <ChevronRight aria-hidden className={styles.chevron} />
        </header>
        <Amount value={current.total} size="lg" />
        <span className={styles.muted}>
          {upcoming > 0
            ? `Siguen ${formatCurrencyShort(upcoming)} en cuotas`
            : `Acumulado en ${formatMonthName(month)}`}
        </span>
      </Card>
    </Link>
  )
}
