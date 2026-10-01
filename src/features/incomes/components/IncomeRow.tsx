import { ArrowDownLeft, CloudOff } from 'lucide-react'
import type { Income } from '@/lib/db'
import { Amount, VisuallyHidden } from '@/ui'
import { formatShortDay } from '@/utils/dates'
import styles from './IncomeRow.module.css'

export interface IncomeRowProps {
  income: Income
  onOpen: (id: string) => void // opens it to edit or delete
}

// Like an expense's row: what it is and the day, the amount on the right
export function IncomeRow({ income, onOpen }: IncomeRowProps) {
  return (
    <li className={styles.row}>
      <button type="button" className={styles.body} onClick={() => onOpen(income.id)}>
        <span className={styles.icon} aria-hidden>
          <ArrowDownLeft />
        </span>
        <span className={styles.info}>
          <span className={styles.title}>
            <VisuallyHidden>Editar </VisuallyHidden>
            {income.name || 'Ingreso'}
          </span>
          <span className={styles.meta}>{formatShortDay(income.receivedAt)}</span>
        </span>
        {income.pending === 1 && (
          <CloudOff className={styles.pending} role="img" aria-label="Sin sincronizar" />
        )}
        <Amount value={income.amount} tone="accent" compactFrom={10_000_000} />
      </button>
    </li>
  )
}
