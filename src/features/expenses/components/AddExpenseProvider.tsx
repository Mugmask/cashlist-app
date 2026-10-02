import { useCallback, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import { IncomeForm } from '@/features/incomes'
import { SegmentedControl, Sheet, Stack, useToast } from '@/ui'
import { AddExpenseContext } from '../addExpense'
import { ExpenseForm } from './ExpenseForm'

type Kind = 'expense' | 'income'

const KINDS = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' },
] as const

const TITLE: Record<Kind, string> = { expense: 'Nuevo gasto', income: 'Nuevo ingreso' }

// Owns the "Nuevo gasto" sheet, so any screen can open it through useAddExpense(). It opens on
// an expense, the usual thing; one tap above the form switches it to an income. It belongs to
// the screen it was opened on: going to another one (Android's back, say) closes it.
export function AddExpenseProvider({
  initiallyOpen = false,
  children,
}: {
  initiallyOpen?: boolean
  children: ReactNode
}) {
  const { pathname } = useLocation()
  const [openOn, setOpenOn] = useState<string | null>(initiallyOpen ? pathname : null)
  const isOpen = openOn === pathname
  // Left for another screen: forgotten, so coming back doesn't open it again
  if (openOn !== null && !isOpen) setOpenOn(null)
  const toast = useToast()
  const [kind, setKind] = useState<Kind>('expense')
  const body = useRef<HTMLDivElement>(null)
  // The income form is shorter: it keeps the expense's height, so the switch stays put
  const [minHeight, setMinHeight] = useState<number>()
  const open = useCallback(() => {
    setKind('expense')
    setMinHeight(undefined)
    setOpenOn(pathname)
  }, [pathname])
  const close = () => setOpenOn(null)
  const changeKind = (next: Kind) => {
    if (kind === 'expense' && body.current) setMinHeight(heightOnScreen(body.current))
    setKind(next)
  }
  const saved = (message: string) => {
    close()
    toast(message)
  }

  return (
    <AddExpenseContext value={open}>
      {children}
      <Sheet open={isOpen} onClose={close} title={TITLE[kind]}>
        <div ref={body} style={{ minHeight }}>
          <Stack gap={4}>
            <SegmentedControl
              label="Qué cargás"
              segments={KINDS}
              value={kind}
              onChange={changeKind}
            />
            {kind === 'expense' ? (
              <ExpenseForm onSaved={() => saved('Gasto guardado')} />
            ) : (
              <IncomeForm onSaved={() => saved('Ingreso guardado')} />
            )}
          </Stack>
        </div>
      </Sheet>
    </AddExpenseContext>
  )
}

// How tall the expense form shows: all of it, or only what the sheet's scrolling body fits
// when it's taller than the screen. Keeping the whole height would leave the shorter income
// form with empty room to scroll into.
function heightOnScreen(form: HTMLElement) {
  const scroller = form.parentElement
  if (!scroller) return form.offsetHeight
  const { paddingTop, paddingBottom } = getComputedStyle(scroller)
  const visible = scroller.clientHeight - parseFloat(paddingTop) - parseFloat(paddingBottom)
  return Math.min(form.offsetHeight, visible)
}
