import { CloudOff } from 'lucide-react'
import { Amount, VisuallyHidden } from '@/ui'
import { formatShortDay } from '@/utils/dates'
import { getCategory } from '../categories'
import type { MonthExpense } from '../installments'
import { CategoryIcon } from './CategoryIcon'
import styles from './ExpenseRow.module.css'

export interface ExpenseRowProps {
  expense: MonthExpense // a purchase in installments shows the month's installment
  showDate?: boolean
  onOpen: (id: string) => void // shows its detail, where it can be edited or deleted
}

// Just what tells expenses apart at a glance; payment method and the rest are in the detail
export function ExpenseRow({ expense, showDate = true, onOpen }: ExpenseRowProps) {
  // Its name when it has one ("Nafta", "Alquiler"), so a list of the same category still
  // tells apart; else the category. The icon always says the category.
  const title = expense.name || getCategory(expense.category).label

  const { installment } = expense
  const meta = [
    showDate && formatShortDay(expense.spentAt),
    installment && `Cuota ${installment.number}/${installment.count}`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <li className={styles.row}>
      <button type="button" className={styles.body} onClick={() => onOpen(expense.id)}>
        <CategoryIcon category={expense.category} />
        <span className={styles.info}>
          <span className={styles.title}>
            <VisuallyHidden>Ver detalle de </VisuallyHidden>
            {title}
          </span>
          {meta && <span className={styles.meta}>{meta}</span>}
        </span>
        {expense.pending === 1 && (
          <CloudOff className={styles.pending} role="img" aria-label="Sin sincronizar" />
        )}
        {/* Dollars as dollars; an installment is always its pesos */}
        {expense.currency === 'USD' && !installment ? (
          <Amount value={expense.foreignAmount!} currency="USD" />
        ) : (
          <Amount value={expense.amount} compactFrom={10_000_000} />
        )}
      </button>
    </li>
  )
}
