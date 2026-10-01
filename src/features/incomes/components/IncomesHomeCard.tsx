import { ChevronRight, HandCoins } from 'lucide-react'
import { Link } from 'react-router'
import { useMonth } from '@/features/month'
import { Amount, Card } from '@/ui'
import { formatMonthName } from '@/utils/dates'
import { useMonthIncomes } from '../incomesRepo'
import styles from './IncomesHomeCard.module.css'

// The month's other incomes at a glance, leading to the incomes screen. Always shown, even
// with none: it's also the way to get there.
export function IncomesHomeCard() {
  const { month } = useMonth()
  const data = useMonthIncomes(month)

  if (!data) return null

  const count = data.incomes.length || 'Ninguno'

  return (
    <Link to="/incomes" className={styles.link}>
      <Card as="section" aria-labelledby="incomes-title">
        <header className={styles.header}>
          <span className={styles.icon} aria-hidden>
            <HandCoins />
          </span>
          <h2 id="incomes-title" className={styles.title}>
            Otros ingresos
          </h2>
          <ChevronRight aria-hidden className={styles.chevron} />
        </header>
        <div className={styles.line}>
          <span className={styles.label}>
            {count} en {formatMonthName(month)}
          </span>
          <Amount value={data.total} size="lg" />
        </div>
      </Card>
    </Link>
  )
}
