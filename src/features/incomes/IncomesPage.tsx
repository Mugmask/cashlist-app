import { HandCoins, Plus } from 'lucide-react'
import { useState } from 'react'
import { useMonth } from '@/features/month'
import { useProfile } from '@/features/profile'
import {
  Amount,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Sheet,
  Stack,
  usePrimaryAction,
  useToast,
} from '@/ui'
import { formatMonthName } from '@/utils/dates'
import { IncomeForm } from './components/IncomeForm'
import { IncomeRow } from './components/IncomeRow'
import { IncomeSheet } from './components/IncomeSheet'
import { useMonthIncomes } from './incomesRepo'
import styles from './IncomesPage.module.css'

// What the month has to spend: the monthly income from the profile, plus every other income
// loaded in it. On this screen the bottom nav's + loads an income.
export function IncomesPage() {
  const { month } = useMonth()
  const data = useMonthIncomes(month)
  const profile = useProfile()
  const toast = useToast()
  const [isAdding, setIsAdding] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  usePrimaryAction('Cargar ingreso', () => setIsAdding(true))

  if (!data) return null

  const { incomes, total } = data
  const salary = profile?.monthlyIncome ?? 0
  const monthName = formatMonthName(month)

  return (
    <Stack gap={6}>
      <PageHeader title="Ingresos" />

      <Card as="section" variant="hero" padding="lg" aria-label="Ingresos del mes">
        <span className={styles.label}>Para gastar en {monthName}</span>
        <Amount value={salary + total} size="xl" />
        <div className={styles.lines}>
          <div className={styles.line}>
            <span>Ingreso mensual (de tu perfil)</span>
            <Amount value={salary} size="sm" />
          </div>
          <div className={styles.line}>
            <span>Otros ingresos</span>
            <Amount value={total} size="sm" />
          </div>
        </div>
      </Card>

      {incomes.length === 0 ? (
        <EmptyState
          icon={<HandCoins />}
          title={`No cargaste otros ingresos en ${monthName}`}
          description="Lo que te transfieren, una venta, un trabajo aparte: suma a lo que tenés para gastar."
          action={
            <Button size="lg" icon={<Plus aria-hidden />} onClick={() => setIsAdding(true)}>
              Cargar ingreso
            </Button>
          }
        />
      ) : (
        <Card padding="none">
          <ul className={styles.list}>
            {incomes.map((income) => (
              <IncomeRow key={income.id} income={income} onOpen={setOpenId} />
            ))}
          </ul>
        </Card>
      )}

      <Sheet open={isAdding} onClose={() => setIsAdding(false)} title="Nuevo ingreso">
        <IncomeForm
          onSaved={() => {
            setIsAdding(false)
            toast('Ingreso guardado')
          }}
        />
      </Sheet>
      <IncomeSheet incomeId={openId} onClose={() => setOpenId(null)} />
    </Stack>
  )
}
