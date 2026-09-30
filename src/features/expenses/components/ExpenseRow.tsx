import { CloudOff, Trash2 } from 'lucide-react'
import type { Expense } from '@/lib/db'
import { Amount, IconButton } from '@/ui'
import { formatShortDay } from '@/utils/dates'
import { getCategory } from '../categories'
import { CategoryIcon } from './CategoryIcon'
import styles from './ExpenseRow.module.css'

export interface ExpenseRowProps {
  expense: Expense
  showDate?: boolean
  onRemove?: (id: string) => void
}

export function ExpenseRow({ expense, showDate = true, onRemove }: ExpenseRowProps) {
  const meta = [showDate && formatShortDay(expense.spentAt), expense.note]
    .filter(Boolean)
    .join(' · ')

  return (
    <li className={styles.row}>
      <CategoryIcon category={expense.category} />
      <div className={styles.info}>
        <span className={styles.title}>{getCategory(expense.category).label}</span>
        {meta && <span className={styles.meta}>{meta}</span>}
      </div>
      {expense.pending === 1 && (
        <CloudOff className={styles.pending} role="img" aria-label="Sin sincronizar" />
      )}
      <Amount value={expense.amount} />
      {onRemove && (
        <IconButton label="Borrar gasto" icon={<Trash2 />} onClick={() => onRemove(expense.id)} />
      )}
    </li>
  )
}
