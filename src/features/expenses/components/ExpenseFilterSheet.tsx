import type { PaymentMethod } from '@/lib/db'
import { Button, ChipGroup, Sheet, Stack } from '@/ui'
import { EXPENSE_CATEGORIES } from '../categories'
import { isFiltered, NO_FILTERS, type ExpenseFilters } from '../filters'

const ALL = 'all'

const CATEGORY_OPTIONS = [
  { value: ALL, label: 'Todas' },
  ...EXPENSE_CATEGORIES.map(({ id, label, icon: Icon }) => ({
    value: id as string,
    label,
    icon: <Icon aria-hidden />,
  })),
]

const METHOD_OPTIONS = [
  { value: ALL, label: 'Todos' },
  { value: 'cash', label: 'Efectivo / débito' },
  { value: 'card', label: 'Tarjeta' },
]

const KIND_OPTIONS = [
  { value: ALL, label: 'Todos' },
  { value: 'variable', label: 'Variables' },
  { value: 'fixed', label: 'Fijos' },
]

// Currency and installments as one choice: installments are always in pesos
const SHOW_OPTIONS = [
  { value: ALL, label: 'Todo' },
  { value: 'pesos', label: 'En pesos' },
  { value: 'usd', label: 'En dólares' },
  { value: 'cuotas', label: 'En cuotas' },
]

export interface ExpenseFilterSheetProps {
  open: boolean
  onClose: () => void
  filters: ExpenseFilters
  onChange: (patch: Partial<ExpenseFilters>) => void
  resultCount: number
}

// Every filter but the search, applied as they're picked: the button shows how many are left
export function ExpenseFilterSheet({
  open,
  onClose,
  filters,
  onChange,
  resultCount,
}: ExpenseFilterSheetProps) {
  const { query, ...rest } = filters
  const show = filters.installments
    ? 'cuotas'
    : filters.currency === 'USD'
      ? 'usd'
      : filters.currency === 'ARS'
        ? 'pesos'
        : ALL

  return (
    <Sheet open={open} onClose={onClose} title="Filtrar gastos">
      <Stack gap={5}>
        <ChipGroup
          label="Categoría"
          showLabel
          options={CATEGORY_OPTIONS}
          value={filters.category ?? ALL}
          onChange={(v) => onChange({ category: v === ALL ? undefined : v })}
        />
        <ChipGroup
          label="Cómo lo pagaste"
          showLabel
          options={METHOD_OPTIONS}
          value={filters.method ?? ALL}
          onChange={(v) => onChange({ method: v === ALL ? undefined : (v as PaymentMethod) })}
        />
        <ChipGroup
          label="Tipo"
          showLabel
          options={KIND_OPTIONS}
          value={filters.kind ?? ALL}
          onChange={(v) =>
            onChange({ kind: v === ALL ? undefined : (v as ExpenseFilters['kind']) })
          }
        />
        <ChipGroup
          label="Mostrar"
          showLabel
          options={SHOW_OPTIONS}
          value={show}
          onChange={(v) =>
            onChange({
              currency: v === 'usd' ? 'USD' : v === 'pesos' ? 'ARS' : undefined,
              installments: v === 'cuotas',
            })
          }
        />
        <Stack gap={3}>
          <Button size="lg" fullWidth onClick={onClose}>
            {resultCount === 1 ? 'Ver 1 gasto' : `Ver ${resultCount} gastos`}
          </Button>
          {isFiltered({ ...NO_FILTERS, ...rest }) && (
            <Button
              variant="ghost"
              size="lg"
              fullWidth
              onClick={() => onChange({ ...NO_FILTERS, query })}
            >
              Limpiar filtros
            </Button>
          )}
        </Stack>
      </Stack>
    </Sheet>
  )
}
