import type { Expense } from '@/lib/db'
import { runSync } from '@/lib/sync'
import { Amount, Card } from '@/ui'
import { formatDayHeading } from '@/utils/dates'
import { expensesRepo } from '../expensesRepo'
import { groupByDay } from '../selectors'
import styles from './ExpenseList.module.css'
import { ExpenseRow } from './ExpenseRow'

// Expenses grouped by day, with a subtotal per day
export function ExpenseList({ expenses }: { expenses: readonly Expense[] }) {
  async function handleRemove(id: string) {
    await expensesRepo.remove(id)
    runSync().catch(() => {})
  }

  return (
    <div className={styles.days}>
      {groupByDay(expenses).map((day) => (
        <section key={day.key} aria-label={formatDayHeading(day.date)}>
          <header className={styles.dayHeader}>
            <h2 className={styles.dayTitle}>{formatDayHeading(day.date)}</h2>
            <Amount value={day.total} size="sm" tone="muted" compactFrom={10_000_000} />
          </header>
          <Card padding="none">
            <ul className={styles.list}>
              {day.expenses.map((e) => (
                <ExpenseRow key={e.id} expense={e} showDate={false} onRemove={handleRemove} />
              ))}
            </ul>
          </Card>
        </section>
      ))}
    </div>
  )
}
