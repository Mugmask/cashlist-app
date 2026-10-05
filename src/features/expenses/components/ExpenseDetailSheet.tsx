import { useLiveQuery } from 'dexie-react-hooks'
import { CloudOff, Pencil, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { Expense } from '@/lib/db'
import { formatRate } from '@/lib/exchangeRates'
import { runSync } from '@/lib/sync'
import { Amount, Button, Sheet, Stack, useToast } from '@/ui'
import { formatCurrencyShort } from '@/utils/currency'
import { formatFullDateTime, formatMonthName, fromPeriod } from '@/utils/dates'
import { getCategory } from '../categories'
import { expensesRepo } from '../expensesRepo'
import { installmentsOf, splitInstallments } from '../installments'
import { PAYMENT_METHOD_OPTIONS } from '../paymentMethods'
import { isFixed } from '../selectors'
import { describeShare } from '../shared'
import { CategoryIcon } from './CategoryIcon'
import styles from './ExpenseDetailSheet.module.css'
import { ExpenseForm } from './ExpenseForm'

export interface ExpenseDetailSheetProps {
  expenseId: string | null // null = closed
  onClose: () => void
}

// Everything about one expense, with edit and delete. It reads the expense live, so an edit
// (or a sync bringing a newer version) shows right away.
export function ExpenseDetailSheet({ expenseId, onClose }: ExpenseDetailSheetProps) {
  const [isEditing, setIsEditing] = useState(false)
  const expense = useLiveQuery(
    () => (expenseId ? expensesRepo.get(expenseId) : undefined),
    [expenseId],
  )
  // Deleted elsewhere (another device, via sync) while open: nothing left to show
  const visible = expense && !expense.deleted ? expense : null

  function close() {
    setIsEditing(false)
    onClose()
  }

  return (
    <Sheet
      open={expenseId !== null && visible !== null}
      onClose={close}
      title={isEditing ? 'Editar gasto' : 'Detalle del gasto'}
    >
      {visible &&
        (isEditing ? (
          <ExpenseForm expense={visible} onSaved={() => setIsEditing(false)} />
        ) : (
          <ExpenseDetail expense={visible} onEdit={() => setIsEditing(true)} onDeleted={close} />
        ))}
    </Sheet>
  )
}

function ExpenseDetail({
  expense,
  onEdit,
  onDeleted,
}: {
  expense: Expense
  onEdit: () => void
  onDeleted: () => void
}) {
  const toast = useToast()
  const fixed = isFixed(expense)
  const dollars = expense.currency === 'USD'
  const category = getCategory(expense.category).label
  // Its name ("Nafta", "Alquiler"), like in the lists; the category when it has none
  const title = expense.name || category
  const method = PAYMENT_METHOD_OPTIONS.find((o) => o.value === (expense.paymentMethod ?? 'cash'))!

  async function handleDelete() {
    const { id } = expense
    await expensesRepo.remove(id)
    toast(fixed ? `Pago de ${title} borrado` : 'Gasto borrado', {
      action: {
        label: 'Deshacer',
        onClick: async () => {
          await expensesRepo.restore(id)
          runSync().catch(() => {})
        },
      },
    })
    runSync().catch(() => {})
    onDeleted()
  }

  return (
    <Stack gap={5}>
      <div className={styles.summary}>
        <CategoryIcon category={expense.category} />
        <div className={styles.summaryText}>
          <span className={styles.title}>{title}</span>
          {dollars ? (
            <Amount value={expense.foreignAmount!} currency="USD" size="xl" />
          ) : (
            <Amount value={expense.amount} size="xl" />
          )}
        </div>
      </div>

      <dl className={styles.facts}>
        {dollars && (
          <Fact label={expense.sharedTotal === undefined ? 'Total en pesos' : 'Tu parte en pesos'}>
            {formatCurrencyShort(expense.amount)}
            <span className={styles.rate}>
              {formatRate({ kind: expense.exchangeRateKind!, rate: expense.exchangeRate! })}
            </span>
          </Fact>
        )}
        {expense.sharedTotal !== undefined && (
          <Fact label="Compartido">
            {formatCurrencyShort(expense.sharedTotal)} en total
            {describeShare(expense) && `, ${describeShare(expense)!.toLowerCase()}`}
          </Fact>
        )}
        <Fact label="Fecha">{formatFullDateTime(expense.spentAt)}</Fact>
        {installmentsOf(expense) > 1 && (
          <Fact label="Cuotas">
            {installmentsOf(expense)} de{' '}
            {formatCurrencyShort(splitInstallments(expense.amount, installmentsOf(expense))[0])}
          </Fact>
        )}
        <Fact label="Categoría">{category}</Fact>
        <Fact label="Cómo lo pagaste">{method.label}</Fact>
        {fixed && expense.fixedPeriod && (
          <Fact label="Pago del fijo">
            {title}, mes de {formatMonthName(fromPeriod(expense.fixedPeriod))}
          </Fact>
        )}
        {expense.note && <Fact label="Nota">{expense.note}</Fact>}
        {expense.pending === 1 && (
          <Fact label="Sincronización">
            <span className={styles.pending}>
              <CloudOff aria-hidden />
              Guardado en este dispositivo, falta subirlo
            </span>
          </Fact>
        )}
      </dl>

      <Stack gap={3}>
        <Button size="lg" fullWidth icon={<Pencil aria-hidden />} onClick={onEdit}>
          Editar
        </Button>
        <Button
          variant="danger"
          size="lg"
          fullWidth
          icon={<Trash2 aria-hidden />}
          onClick={handleDelete}
        >
          {fixed ? 'Borrar pago' : 'Borrar gasto'}
        </Button>
      </Stack>
    </Stack>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.fact}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}
