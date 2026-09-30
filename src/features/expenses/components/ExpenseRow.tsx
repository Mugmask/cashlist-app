import { CloudOff, Trash2 } from 'lucide-react'
import type { Expense } from '@/lib/db'
import { Amount, IconButton } from '@/ui'
import { formatShortDay } from '@/utils/dates'
import { getCategory } from '../categories'
import { isFixed } from '../selectors'
import { CategoryIcon } from './CategoryIcon'
import styles from './ExpenseRow.module.css'

export interface ExpenseRowProps {
  expense: Expense
  showDate?: boolean
  onRemove?: (id: string) => void
}

export function ExpenseRow({ expense, showDate = true, onRemove }: ExpenseRowProps) {
  const fixed = isFixed(expense)
  const category = getCategory(expense.category).label
  // A fixed payment reads as its name ("Alquiler"); a regular expense as its category
  const title = fixed && expense.note ? expense.note : category
  const meta = [showDate && formatShortDay(expense.spentAt), fixed ? category : expense.note]
    .filter(Boolean)
    .join(' · ')

  return (
    <li className={styles.row}>
      <CategoryIcon category={expense.category} />
      <div className={styles.info}>
        <span className={styles.titleLine}>
          <span className={styles.title}>{title}</span>
          {fixed && <span className={styles.badge}>Fijo</span>}
        </span>
        {meta && <span className={styles.meta}>{meta}</span>}
      </div>
      {expense.pending === 1 && (
        <CloudOff className={styles.pending} role="img" aria-label="Sin sincronizar" />
      )}
      <Amount value={expense.amount} compactFrom={10_000_000} />
      {onRemove && (
        <IconButton label="Borrar gasto" icon={<Trash2 />} onClick={() => onRemove(expense.id)} />
      )}
    </li>
  )
}
