import { useState } from 'react'
import { Amount, Card } from '@/ui'
import { formatDayHeading } from '@/utils/dates'
import type { MonthExpense } from '../installments'
import { groupByDay } from '../selectors'
import { ExpenseDetailSheet } from './ExpenseDetailSheet'
import styles from './ExpenseList.module.css'
import { ExpenseRow } from './ExpenseRow'

// A month's expenses grouped by day, with a subtotal per day. Installments of purchases from
// earlier months go in their own group: their day belongs to another month.
export function ExpenseList({ expenses }: { expenses: readonly MonthExpense[] }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const carried = expenses.filter((e) => e.installment && e.installment.number > 1)
  const ofTheMonth = expenses.filter((e) => !carried.includes(e))

  return (
    <div className={styles.days}>
      {groupByDay(ofTheMonth).map((day) => (
        <Group
          key={day.key}
          title={formatDayHeading(day.date)}
          total={day.total}
          expenses={day.expenses}
          onOpen={setOpenId}
        />
      ))}
      {carried.length > 0 && (
        <Group
          title="Cuotas de compras anteriores"
          total={carried.reduce((sum, e) => sum + e.amount, 0)}
          expenses={carried}
          onOpen={setOpenId}
        />
      )}
      <ExpenseDetailSheet expenseId={openId} onClose={() => setOpenId(null)} />
    </div>
  )
}

function Group({
  title,
  total,
  expenses,
  onOpen,
}: {
  title: string
  total: number
  expenses: readonly MonthExpense[]
  onOpen: (id: string) => void
}) {
  return (
    <section aria-label={title}>
      <header className={styles.dayHeader}>
        <h2 className={styles.dayTitle}>{title}</h2>
        <Amount value={total} size="sm" tone="muted" compactFrom={10_000_000} />
      </header>
      <Card padding="none">
        <ul className={styles.list}>
          {expenses.map((e) => (
            <ExpenseRow key={e.id} expense={e} showDate={false} onOpen={onOpen} />
          ))}
        </ul>
      </Card>
    </section>
  )
}
