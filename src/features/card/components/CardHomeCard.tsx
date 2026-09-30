import { CircleCheck, CreditCard } from 'lucide-react'
import { runSync } from '@/lib/sync'
import { Amount, Button, Card, useToast } from '@/ui'
import { formatMonthName, shiftMonth } from '@/utils/dates'
import { cardRepo } from '../cardRepo'
import { useCardSummary } from '../useCardSummary'
import styles from './CardHomeCard.module.css'

// What's accumulating on the credit card this month, and last month's statement to pay.
// Hidden for anyone who doesn't use a card.
export function CardHomeCard() {
  const summary = useCardSummary()
  const toast = useToast()

  if (!summary) return null

  const { now, current, previous } = summary
  if (current.total === 0 && !previous) return null

  const thisMonth = formatMonthName(now)
  const lastMonth = formatMonthName(shiftMonth(now, -1))

  async function handleMarkPaid(period: string) {
    await cardRepo.markPaid(period)
    toast(`Resumen de ${lastMonth} marcado como pagado`)
    runSync().catch(() => {})
  }

  async function handleUndo(period: string) {
    await cardRepo.unmarkPaid(period)
    toast(`Resumen de ${lastMonth} sin pagar`)
    runSync().catch(() => {})
  }

  return (
    <Card as="section" aria-labelledby="card-summary-title">
      <header className={styles.header}>
        <span className={styles.icon} aria-hidden>
          <CreditCard />
        </span>
        <h2 id="card-summary-title" className={styles.title}>
          Tarjeta de crédito
        </h2>
      </header>

      {previous && (
        <div className={styles.statement}>
          <div className={styles.line}>
            <span className={styles.label}>Resumen de {lastMonth}</span>
            <Amount value={previous.total} tone={previous.paid ? 'muted' : 'default'} />
          </div>
          {previous.paid ? (
            <div className={styles.paid}>
              <span className={styles.paidText}>
                <CircleCheck aria-hidden />
                Pagado
              </span>
              <Button variant="ghost" onClick={() => handleUndo(previous.period)}>
                Deshacer
              </Button>
            </div>
          ) : (
            <Button variant="secondary" fullWidth onClick={() => handleMarkPaid(previous.period)}>
              Pagué el resumen
            </Button>
          )}
        </div>
      )}

      <div className={styles.line}>
        <span className={styles.label}>Acumulado en {thisMonth}</span>
        <Amount value={current.total} size="lg" />
      </div>
    </Card>
  )
}
