import { RotateCcw } from 'lucide-react'
import { CategoryIcon } from '@/features/expenses'
import { runSync } from '@/lib/sync'
import { Amount, Button, cx, IconButton } from '@/ui'
import { dueLabel } from '../dueLabel'
import { fixedRepo } from '../fixedRepo'
import type { FixedLine } from '../overview'
import styles from './FixedList.module.css'

export interface FixedListProps {
  lines: readonly FixedLine[]
  onEdit: (line: FixedLine) => void
  onPay: (line: FixedLine) => void
}

export function FixedList({ lines, onEdit, onPay }: FixedListProps) {
  async function handleUndo(expenseId: string) {
    await fixedRepo.undoPayment(expenseId)
    runSync().catch(() => {})
  }

  return (
    <ul className={styles.list}>
      {lines.map((line) => {
        const due = dueLabel(line)
        const isPaid = line.status === 'paid'
        return (
          <li key={line.fixed.id} className={styles.row}>
            <button
              type="button"
              className={styles.body}
              onClick={() => onEdit(line)}
              aria-label={`Editar ${line.fixed.name}`}
            >
              <CategoryIcon category={line.fixed.category} />
              <span className={styles.info}>
                <span className={styles.name}>{line.fixed.name}</span>
                <span className={cx(styles.due, styles[due.tone])}>{due.text}</span>
              </span>
            </button>
            <Amount value={line.amount} tone={isPaid ? 'muted' : 'default'} />
            {isPaid ? (
              <IconButton
                label={`Deshacer pago de ${line.fixed.name}`}
                icon={<RotateCcw />}
                onClick={() => handleUndo(line.payment!.id)}
              />
            ) : (
              <Button variant="secondary" onClick={() => onPay(line)}>
                Pagar
              </Button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
