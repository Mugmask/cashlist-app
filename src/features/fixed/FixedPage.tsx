import { CalendarCheck, Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { FixedExpense } from '@/lib/db'
import {
  Amount,
  Button,
  Card,
  EmptyState,
  IconButton,
  PageHeader,
  ProgressBar,
  Sheet,
  Stack,
} from '@/ui'
import { formatMonthName } from '@/utils/dates'
import { FixedExpenseForm } from './components/FixedExpenseForm'
import { FixedList } from './components/FixedList'
import { PayFixedForm } from './components/PayFixedForm'
import styles from './FixedPage.module.css'
import type { FixedLine } from './overview'
import { useFixedOverview } from './useFixedOverview'

type SheetState =
  | { kind: 'create' }
  | { kind: 'edit'; fixed: FixedExpense }
  | { kind: 'pay'; line: FixedLine }
  | null

const SHEET_TITLE = { create: 'Nuevo gasto fijo', edit: 'Editar gasto fijo', pay: 'Registrar pago' }

export function FixedPage() {
  const overview = useFixedOverview()
  const [sheet, setSheet] = useState<SheetState>(null)

  if (!overview) return null

  const { pending, paid, totals, period, today } = overview
  const monthName = formatMonthName(today)
  const isEmpty = pending.length === 0 && paid.length === 0
  const close = () => setSheet(null)

  return (
    <Stack gap={6}>
      <PageHeader
        title="Gastos fijos"
        subtitle={`Tu mes de ${monthName}`}
        action={
          !isEmpty && (
            <IconButton
              label="Agregar gasto fijo"
              icon={<Plus />}
              variant="accent"
              onClick={() => setSheet({ kind: 'create' })}
            />
          )
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={<CalendarCheck />}
          title="Cargá tus gastos fijos"
          description="Alquiler, expensas, internet: lo que pagás todos los meses. Cada mes te aparecen para marcarlos como pagados."
          action={
            <Button
              size="lg"
              icon={<Plus aria-hidden />}
              onClick={() => setSheet({ kind: 'create' })}
            >
              Agregar gasto fijo
            </Button>
          }
        />
      ) : (
        <>
          <Card as="section" variant="hero" padding="lg" aria-label="Resumen de fijos">
            <span className={styles.label}>
              {totals.remaining > 0 ? 'Te falta pagar' : 'Pagaste todos los fijos'}
            </span>
            <Amount value={totals.remaining > 0 ? totals.remaining : totals.paid} size="xl" />
            <ProgressBar
              label="Fijos pagados"
              value={totals.paid}
              max={totals.expected}
              tone="accent"
              className={styles.bar}
            />
            <div className={styles.footer}>
              <span>
                Pagado <Amount value={totals.paid} size="sm" />
              </span>
              <span>
                de <Amount value={totals.expected} size="sm" />
              </span>
            </div>
          </Card>

          {pending.length > 0 && (
            <Section title="A pagar">
              <Card padding="none">
                <FixedList
                  lines={pending}
                  onEdit={(line) => setSheet({ kind: 'edit', fixed: line.fixed })}
                  onPay={(line) => setSheet({ kind: 'pay', line })}
                />
              </Card>
            </Section>
          )}

          {paid.length > 0 && (
            <Section title="Pagados">
              <Card padding="none">
                <FixedList
                  lines={paid}
                  onEdit={(line) => setSheet({ kind: 'edit', fixed: line.fixed })}
                  onPay={(line) => setSheet({ kind: 'pay', line })}
                />
              </Card>
            </Section>
          )}
        </>
      )}

      <Sheet open={sheet !== null} onClose={close} title={sheet ? SHEET_TITLE[sheet.kind] : ''}>
        {sheet?.kind === 'create' && <FixedExpenseForm onDone={close} />}
        {sheet?.kind === 'edit' && <FixedExpenseForm fixed={sheet.fixed} onDone={close} />}
        {sheet?.kind === 'pay' && (
          <PayFixedForm line={sheet.line} period={period} monthName={monthName} onDone={close} />
        )}
      </Sheet>
    </Stack>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  )
}
