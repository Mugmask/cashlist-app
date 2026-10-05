import { RotateCcw, Users } from 'lucide-react'
import { CategoryIcon } from '@/features/expenses'
import { runSync } from '@/lib/sync'
import { Button, cx, IconButton, useToast, VisuallyHidden } from '@/ui'
import { formatCurrencyShort } from '@/utils/currency'
import { formatShortDay } from '@/utils/dates'
import { dueLabel } from '../dueLabel'
import { fixedRepo } from '../fixedRepo'
import { shareLabel } from '../fixedShare'
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
        const isPaid = line.payment !== undefined
        const due = line.due && dueLabel(line.due)
        const shared = shareLabel(line.fixed)
        return (
          <li key={line.fixed.id} className={styles.row}>
            <button type="button" className={styles.body} onClick={() => onEdit(line)}>
              <CategoryIcon category={line.fixed.category} />
              <span className={styles.info}>
                <span className={styles.name}>
                  <VisuallyHidden>Editar </VisuallyHidden>
                  {line.fixed.name}
                </span>
                <span className={styles.detail}>
                  <span className={cx(styles.amount, isPaid && styles.muted)}>
                    {formatCurrencyShort(line.shown.value, line.shown.currency)}
                  </span>
                  {/* Shared: the amount is my part. An icon, so the due date keeps its room */}
                  {shared && <Users className={styles.shared} role="img" aria-label={shared} />}
                  {isPaid ? (
                    <span className={styles.note}>
                      Pagado el {formatShortDay(line.payment!.spentAt)}
                    </span>
                  ) : (
                    due && <span className={cx(styles.note, styles[due.tone])}>{due.text}</span>
                  )}
                </span>
              </span>
            </button>
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
