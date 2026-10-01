import { ChevronRight, HandCoins, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useMonth } from '@/features/month'
import { profileRepo, useProfile } from '@/features/profile'
import { runSync } from '@/lib/sync'
import {
  Amount,
  AmountField,
  Button,
  Card,
  EmptyState,
  PageHeader,
  PageLoader,
  Sheet,
  Stack,
  usePrimaryAction,
  useToast,
} from '@/ui'
import { amountToInput, parseAmount } from '@/utils/currency'
import { formatMonthName } from '@/utils/dates'
import { IncomeForm } from './components/IncomeForm'
import { IncomeRow } from './components/IncomeRow'
import { IncomeSheet } from './components/IncomeSheet'
import { useMonthIncomes } from './incomesRepo'
import styles from './IncomesPage.module.css'

// What came in during the month: the monthly income from the profile (editable right here),
// plus every other income loaded in it. What's left to spend, with what the months before
// carried, is on home. On this screen the bottom nav's + loads an income.
export function IncomesPage() {
  const { month } = useMonth()
  const data = useMonthIncomes(month)
  const profile = useProfile()
  const toast = useToast()
  const [isAdding, setIsAdding] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [isEditingSalary, setIsEditingSalary] = useState(false)
  usePrimaryAction('Cargar ingreso', () => setIsAdding(true))

  if (!data || profile === undefined) return <PageLoader />

  const { incomes, total } = data
  const salary = profile?.monthlyIncome ?? 0
  const monthName = formatMonthName(month)

  return (
    <Stack gap={6}>
      <PageHeader title="Ingresos" />

      <Card as="section" variant="hero" padding="lg" aria-label="Ingresos del mes">
        <span className={styles.label}>Entró en {monthName}</span>
        <Amount value={salary + total} size="xl" />
        <div className={styles.lines}>
          <button
            type="button"
            className={styles.lineButton}
            onClick={() => setIsEditingSalary(true)}
            aria-label={`Ingreso mensual: ${salary > 0 ? amountToInput(salary) : 'sin cargar'}. Cambiar`}
          >
            <span>Ingreso mensual</span>
            {salary > 0 ? <Amount value={salary} size="sm" /> : <span>Cargalo</span>}
            <ChevronRight aria-hidden />
          </button>
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
      <Sheet
        open={isEditingSalary}
        onClose={() => setIsEditingSalary(false)}
        title="Ingreso mensual"
      >
        <SalaryForm
          salary={profile?.monthlyIncome}
          onSaved={() => {
            setIsEditingSalary(false)
            toast('Ingreso mensual guardado')
          }}
        />
      </Sheet>
    </Stack>
  )
}

// What comes in every month, the same as in the profile. It counts for every month, the ones
// before too.
function SalaryForm({ salary, onSaved }: { salary?: number; onSaved: () => void }) {
  const [amount, setAmount] = useState(salary ? amountToInput(salary) : '')
  const value = parseAmount(amount)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (value === null) return
    await profileRepo.saveMonthlyIncome(value)
    runSync().catch(() => {}) // on failure it stays pending and retries on its own
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={4}>
        <AmountField
          label="Ingreso mensual"
          value={amount}
          onValueChange={setAmount}
          autoFocus
          required
        />
        <p className={styles.hint}>
          Tu sueldo o lo que cobrás todos los meses. Cuenta para todos los meses, también los
          anteriores.
        </p>
        <Button type="submit" size="lg" fullWidth disabled={value === null}>
          Guardar
        </Button>
      </Stack>
    </form>
  )
}
