import { CloudOff } from 'lucide-react'
import type { Expense } from '@/lib/db'
import { Amount, VisuallyHidden } from '@/ui'
import { formatShortDay } from '@/utils/dates'
import { getCategory } from '../categories'
import { isFixed } from '../selectors'
import { CategoryIcon } from './CategoryIcon'
import styles from './ExpenseRow.module.css'

export interface ExpenseRowProps {
  expense: Expense
  showDate?: boolean
  onOpen: (id: string) => void // shows its detail, where it can be edited or deleted
}

// Just what tells expenses apart at a glance; note, payment method and the rest are in the detail
export function ExpenseRow({ expense, showDate = true, onOpen }: ExpenseRowProps) {
  // A fixed payment reads as its name ("Alquiler"); a regular expense as its category
  const title =
    isFixed(expense) && expense.note ? expense.note : getCategory(expense.category).label

  return (
    <li className={styles.row}>
      <button type="button" className={styles.body} onClick={() => onOpen(expense.id)}>
        <CategoryIcon category={expense.category} />
        <span className={styles.info}>
          <span className={styles.title}>
            <VisuallyHidden>Ver detalle de </VisuallyHidden>
            {title}
          </span>
          {showDate && <span className={styles.meta}>{formatShortDay(expense.spentAt)}</span>}
        </span>
        {expense.pending === 1 && (
          <CloudOff className={styles.pending} role="img" aria-label="Sin sincronizar" />
        )}
        {expense.currency === 'USD' ? (
          <Amount value={expense.foreignAmount!} currency="USD" />
        ) : (
          <Amount value={expense.amount} compactFrom={10_000_000} />
        )}
      </button>
    </li>
  )
}
