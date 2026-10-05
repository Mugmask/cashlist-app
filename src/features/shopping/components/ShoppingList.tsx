import { ChevronDown, SearchX, SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import type { ShoppingItem } from '@/lib/db'
import { Button, Card, cx, EmptyState } from '@/ui'
import { aisleLabel, groupByAisle, type AisleNames } from '../aisles'
import {
  applyListFilters,
  NO_LIST_FILTERS,
  readListFilters,
  writeListFilters,
  type ListFilters,
} from '../listFilters'
import { AisleNamesSheet } from './AisleNamesSheet'
import { ItemList } from './ItemList'
import styles from './ShoppingList.module.css'
import { ShoppingFilterSheet } from './ShoppingFilterSheet'

const COLLAPSED_KEY = 'cashlist:shopping-collapsed'

// Which sections the user closed, remembered on this device. Storage can be off (a private
// window): then nothing is remembered and everything starts open.
function readCollapsed(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(COLLAPSED_KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

function saveCollapsed(keys: Set<string>) {
  try {
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...keys]))
  } catch {
    // remembered for this visit only
  }
}

export interface ShoppingListProps {
  toBuy: readonly ShoppingItem[]
  inCart: readonly ShoppingItem[]
  names: AisleNames // the user's names for the sections
}

// The list by store section in the order it's walked, what's in the cart last. Each section
// opens and closes; filters (like the expenses') narrow it to a section or to the cart, and
// live in the URL. Sections can be renamed from the filters.
export function ShoppingList({ toBuy, inCart, names }: ShoppingListProps) {
  const [params, setParams] = useSearchParams()
  const filters = readListFilters(params)
  const update = (patch: Partial<ListFilters>) =>
    setParams(writeListFilters({ ...filters, ...patch }), { replace: true })
  const [isFiltering, setIsFiltering] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [collapsed, setCollapsed] = useState(readCollapsed)

  const shownToBuy = applyListFilters(toBuy, filters)
  const shownInCart = applyListFilters(inCart, filters)
  const groups = [
    ...groupByAisle(shownToBuy).map((g) => ({
      key: g.aisle,
      title: aisleLabel(g.aisle, names),
      items: g.items,
    })),
    ...(shownInCart.length > 0
      ? [{ key: 'cart', title: 'En el carrito', items: shownInCart }]
      : []),
  ]
  const resultCount = shownToBuy.length + shownInCart.length
  const active = activeFilters(filters, names)

  function toggleSection(key: string) {
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      saveCollapsed(next)
      return next
    })
  }

  return (
    <section aria-label="Para comprar" className={styles.list}>
      <div className={styles.header}>
        <h2 className={styles.title}>Para comprar</h2>
        <div className={styles.tools}>
          <Button
            variant="secondary"
            icon={<SlidersHorizontal aria-hidden />}
            onClick={() => setIsFiltering(true)}
            aria-label={active.length > 0 ? `Filtros, ${active.length} activos` : 'Filtros'}
          >
            {active.length > 0 && <span className={styles.count}>{active.length}</span>}
          </Button>
        </div>
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

      {groups.length === 0 ? (
        <EmptyState
          icon={<SearchX />}
          title="Nada con estos filtros"
          description="Probá con otra sección o sacá algún filtro."
          action={
            <Button variant="secondary" onClick={() => update(NO_LIST_FILTERS)}>
              Limpiar filtros
            </Button>
          }
        />
      ) : (
        <Card padding="none">
          {groups.map((group) => {
            const open = !collapsed.has(group.key)
            const id = `shopping-section-${group.key}`
            return (
              <section key={group.key} aria-label={group.title} className={styles.group}>
                <h3 className={styles.groupHeading}>
                  <button
                    type="button"
                    className={styles.groupToggle}
                    aria-expanded={open}
                    aria-controls={id}
                    onClick={() => toggleSection(group.key)}
                  >
                    <span className={styles.groupTitle}>{group.title}</span>
                    <span className={styles.groupCount}>{group.items.length}</span>
                    <ChevronDown
                      aria-hidden
                      className={cx(styles.chevron, !open && styles.closed)}
                    />
                  </button>
                </h3>
                <div id={id} hidden={!open}>
                  <ItemList items={group.items} />
                </div>
              </section>
            )
          })}
        </Card>
      )}

      <ShoppingFilterSheet
        open={isFiltering}
        onClose={() => setIsFiltering(false)}
        filters={filters}
        onChange={update}
        resultCount={resultCount}
        names={names}
        onRename={() => {
          setIsFiltering(false)
          setIsRenaming(true)
        }}
      />
      <AisleNamesSheet open={isRenaming} onClose={() => setIsRenaming(false)} />
    </section>
  )
}

// The filters in use, each with how to remove it
function activeFilters(filters: ListFilters, names: AisleNames) {
  const active: { key: string; label: string; clear: Partial<ListFilters> }[] = []
  if (filters.aisle) {
    active.push({
      key: 'seccion',
      label: aisleLabel(filters.aisle, names),
      clear: { aisle: undefined },
    })
  }
  if (filters.show) {
    const label = filters.show === 'in_cart' ? 'En el carrito' : 'Para comprar'
    active.push({ key: 'ver', label, clear: { show: undefined } })
  }
  return active
}
