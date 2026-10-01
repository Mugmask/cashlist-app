import { CalendarCheck, ChevronRight, CircleCheck } from 'lucide-react'
import { Link } from 'react-router'
import { useMonth } from '@/features/month'
import { Amount, Card } from '@/ui'
import { useFixedOverview } from '../useFixedOverview'
import styles from './FixedHomeCard.module.css'

const PREVIEW_COUNT = 3

// This month's fixed expenses at a glance: what's left to pay and the most urgent one
export function FixedHomeCard() {
  const { month } = useMonth()
  const overview = useFixedOverview(month)

  if (!overview) return null

  const { pending, paid, totals } = overview

  if (pending.length === 0 && paid.length === 0) {
    return (
      <Link to="/fixed" className={styles.link}>
        <Card className={styles.card}>
          <span className={styles.icon} aria-hidden>
            <CalendarCheck />
          </span>
          <div className={styles.text}>
            <strong>Cargá tus gastos fijos</strong>
            <span className={styles.muted}>Alquiler, expensas, internet…</span>
          </div>
          <ChevronRight aria-hidden className={styles.chevron} />
        </Card>
      </Link>
    )
  }

  if (pending.length === 0) {
    return (
      <Link to="/fixed" className={styles.link}>
        <Card className={styles.card}>
          <span className={styles.icon} aria-hidden>
            <CircleCheck />
          </span>
          <div className={styles.text}>
            <strong>Fijos del mes pagados</strong>
            <span className={styles.muted}>
              {paid.length === 1 ? '1 pago' : `${paid.length} pagos`} registrados
            </span>
          </div>
          <ChevronRight aria-hidden className={styles.chevron} />
        </Card>
      </Link>
    )
  }

  // Which ones are left, like the shopping card: "Internet, Netflix y 2 más"
  const names = pending.slice(0, PREVIEW_COUNT).map((l) => l.fixed.name)
  const rest = pending.length - names.length

  return (
    <Link to="/fixed" className={styles.link}>
      <Card>
        <div className={styles.header}>
          <span className={styles.title}>Gastos fijos</span>
          <ChevronRight aria-hidden className={styles.chevron} />
        </div>
        <div className={styles.amountLine}>
          <span className={styles.muted}>
            {pending.length === 1 ? 'Te falta 1 pago' : `Te faltan ${pending.length} pagos`}
          </span>
          <Amount value={totals.remaining} size="lg" />
        </div>
        <p className={styles.next}>
          {names.join(', ')}
          {rest > 0 && ` y ${rest} más`}
        </p>
      </Card>
    </Link>
  )
}
