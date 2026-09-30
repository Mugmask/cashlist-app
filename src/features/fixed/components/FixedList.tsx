import { RotateCcw } from 'lucide-react'
import { CategoryIcon } from '@/features/expenses'
import { runSync } from '@/lib/sync'
import { Amount, Button, cx, IconButton, useToast, VisuallyHidden } from '@/ui'
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
  const toast = useToast()

  async function handleUndo(line: FixedLine) {
    await fixedRepo.undoPayment(line.payment!.id)
    toast(`Pago de ${line.fixed.name} deshecho`)
    runSync().catch(() => {})
  }

  return (
    <ul className={styles.list}>
      {lines.map((line) => {
        const due = dueLabel(line)
        const isPaid = line.status === 'paid'
        return (
          <li key={line.fixed.id} className={styles.row}>
            <button type="button" className={styles.body} onClick={() => onEdit(line)}>
              <CategoryIcon category={line.fixed.category} />
              <span className={styles.info}>
                <span className={styles.name}>
                  <VisuallyHidden>Editar </VisuallyHidden>
                  {line.fixed.name}
                </span>
                <span className={cx(styles.due, styles[due.tone])}>{due.text}</span>
              </span>
            </button>
            <Amount
              value={line.amount}
              tone={isPaid ? 'muted' : 'default'}
              compactFrom={10_000_000}
            />
            {isPaid ? (
              <IconButton
                label={`Deshacer pago de ${line.fixed.name}`}
                icon={<RotateCcw />}
                onClick={() => handleUndo(line)}
              />
            ) : (
              <Button
                variant="secondary"
                onClick={() => onPay(line)}
                aria-label={`Pagar ${line.fixed.name}`}
              >
                Pagar
              </Button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
