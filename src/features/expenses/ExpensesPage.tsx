import { Plus, ReceiptText, Search, SearchX, SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { useMonth } from '@/features/month'
import { Amount, Button, EmptyState, PageHeader, Stack, TextField } from '@/ui'
import { formatMonthName } from '@/utils/dates'
import { useAddExpense } from './addExpense'
import { getCategory } from './categories'
import { ExpenseFilterSheet } from './components/ExpenseFilterSheet'
import { ExpenseList } from './components/ExpenseList'
import styles from './ExpensesPage.module.css'
import {
  applyFilters,
  isFiltered,
  NO_FILTERS,
  readFilters,
  writeFilters,
  type ExpenseFilters,
} from './filters'
import { useMonthExpenses } from './useMonthExpenses'

// The month's expenses, searchable and filterable. The filters live in the URL, so back,
// reload and links (the home's card → "?pago=tarjeta") keep them.
export function ExpensesPage() {
  const { month: selected } = useMonth()
  const month = useMonthExpenses(selected)
  const addExpense = useAddExpense()
  const [params, setParams] = useSearchParams()
  const [isFiltering, setIsFiltering] = useState(false)
  const filters = readFilters(params)
  const update = (patch: Partial<ExpenseFilters>) =>
    setParams(writeFilters({ ...filters, ...patch }), { replace: true })

  if (!month) return null

  const expenses = applyFilters(month.expenses, filters)
  const total = expenses.reduce((sum, e) => sum + e.amount, 0)
  const monthName = formatMonthName(selected)
  const active = activeFilters(filters)
  const filtered = isFiltered(filters)

  return (
    <Stack gap={5}>
      <PageHeader title="Gastos" action={<Amount value={total} size="lg" />} />

      {month.expenses.length > 0 && (
        <div className={styles.tools}>
          <div className={styles.toolbar}>
            <TextField
              label="Buscar gastos"
              hideLabel
              type="search"
              placeholder="Buscar (ej: pedidosya)"
              icon={<Search />}
              value={filters.query}
              onChange={(e) => update({ query: e.target.value })}
              enterKeyHint="search"
              autoComplete="off"
              className={styles.search}
            />
            <Button
              variant="secondary"
              icon={<SlidersHorizontal aria-hidden />}
              onClick={() => setIsFiltering(true)}
              aria-label={active.length > 0 ? `Filtros, ${active.length} activos` : 'Filtros'}
            >
              {active.length > 0 && <span className={styles.count}>{active.length}</span>}
            </Button>
          </div>
          {active.length > 0 && (
            <ul className={styles.chips} aria-label="Filtros activos">
              {active.map(({ key, label, clear }) => (
                <li key={key}>
                  <button
                    type="button"
                    className={styles.chip}
                    onClick={() => update(clear)}
                    aria-label={`Quitar filtro ${label}`}
                  >
                    {label}
                    <X aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {month.expenses.length === 0 ? (
        <EmptyState
          icon={<ReceiptText />}
          title={`No hay gastos en ${monthName}`}
          description="Los gastos del mes aparecen acá, día por día."
          action={
            <Button size="lg" icon={<Plus aria-hidden />} onClick={addExpense}>
              Cargar gasto
            </Button>
          }
        />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={<SearchX />}
          title="Ningún gasto coincide"
          description={`Probá con otra búsqueda o sacá algún filtro de ${monthName}.`}
          action={
            filtered && (
              <Button variant="secondary" onClick={() => update(NO_FILTERS)}>
                Limpiar todo
              </Button>
            )
          }
        />
      ) : (
        <ExpenseList expenses={expenses} />
      )}

      <ExpenseFilterSheet
        open={isFiltering}
        onClose={() => setIsFiltering(false)}
        filters={filters}
        onChange={update}
        resultCount={expenses.length}
      />
    </Stack>
  )
}

// The filters in use (search apart, it's visible in its field), each with how to remove it
function activeFilters(filters: ExpenseFilters) {
  const active: { key: string; label: string; clear: Partial<ExpenseFilters> }[] = []
  if (filters.category) {
    const label = getCategory(filters.category).label
    active.push({ key: 'cat', label, clear: { category: undefined } })
  }
  if (filters.method) {
    const label = filters.method === 'card' ? 'Con tarjeta' : 'Efectivo / débito'
    active.push({ key: 'pago', label, clear: { method: undefined } })
  }
  if (filters.kind) {
    const label = filters.kind === 'fixed' ? 'Fijos' : 'Variables'
    active.push({ key: 'tipo', label, clear: { kind: undefined } })
  }
  if (filters.dollars) active.push({ key: 'usd', label: 'En dólares', clear: { dollars: false } })
  if (filters.installments) {
    active.push({ key: 'cuotas', label: 'En cuotas', clear: { installments: false } })
  }
  return active
}
