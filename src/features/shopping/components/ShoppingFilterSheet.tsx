import { Settings2 } from 'lucide-react'
import { Button, ChipGroup, Sheet, Stack } from '@/ui'
import { AISLES, aisleLabel, type AisleId, type AisleNames } from '../aisles'
import { countListFilters, NO_LIST_FILTERS, type ListFilters } from '../listFilters'
import styles from './ShoppingFilterSheet.module.css'

const ALL = 'all'

const SHOW_OPTIONS = [
  { value: ALL, label: 'Todo' },
  { value: 'to_buy', label: 'Para comprar' },
  { value: 'in_cart', label: 'En el carrito' },
]

export interface ShoppingFilterSheetProps {
  open: boolean
  onClose: () => void
  filters: ListFilters
  onChange: (patch: Partial<ListFilters>) => void
  resultCount: number
  names: AisleNames // the user's names for the sections
  onRename: () => void // opens the sections' names
}

// Like the expenses' filters: applied as they're picked, the button says how many are left
export function ShoppingFilterSheet({
  open,
  onClose,
  filters,
  onChange,
  resultCount,
  names,
  onRename,
}: ShoppingFilterSheetProps) {
  const aisleOptions = [
    { value: ALL, label: 'Todas' },
    ...AISLES.map((a) => ({ value: a.id, label: aisleLabel(a.id, names) })),
  ]
  return (
    <Sheet open={open} onClose={onClose} title="Filtrar lista">
      <Stack gap={5}>
        <ChipGroup
          label="Sección"
          showLabel
          options={aisleOptions}
          value={filters.aisle ?? ALL}
          onChange={(v) => onChange({ aisle: v === ALL ? undefined : (v as AisleId) })}
          after={
            <button type="button" className={styles.edit} onClick={onRename}>
              <Settings2 aria-hidden />
              Renombrar
            </button>
          }
        />
        <ChipGroup
          label="Mostrar"
          showLabel
          options={SHOW_OPTIONS}
          value={filters.show ?? ALL}
          onChange={(v) => onChange({ show: v === ALL ? undefined : (v as ListFilters['show']) })}
        />
        <Stack gap={3}>
          <Button size="lg" fullWidth onClick={onClose}>
            {resultCount === 1 ? 'Ver 1 producto' : `Ver ${resultCount} productos`}
          </Button>
          {countListFilters(filters) > 0 && (
            <Button variant="ghost" size="lg" fullWidth onClick={() => onChange(NO_LIST_FILTERS)}>
              Limpiar filtros
            </Button>
          )}
        </Stack>
      </Stack>
    </Sheet>
  )
}
