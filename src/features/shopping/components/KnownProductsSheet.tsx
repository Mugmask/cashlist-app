import { ChevronDown, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { ShoppingItem } from '@/lib/db'
import { runSync } from '@/lib/sync'
import { cx, IconButton, Sheet, TextField, useToast } from '@/ui'
import { formatDaysAgo } from '@/utils/dates'
import { normalizeName } from '@/utils/text'
import { aisleLabel, aisleOf, type AisleId, type AisleNames } from '../aisles'
import { shoppingRepo } from '../shoppingRepo'
import { AislePicker } from './AislePicker'
import styles from './KnownProductsSheet.module.css'

const collator = new Intl.Collator('es', { sensitivity: 'base' })

export interface KnownProductsSheetProps {
  open: boolean
  onClose: () => void
  items: readonly ShoppingItem[] // every product, on the list or not
  names: AisleNames // the user's names for the sections
}

// Every product, searchable, with its store section (tap it to move it to another one). The
// ones off the list can be added back, or forgotten when no longer bought (so they stop
// showing among the frequent ones).
export function KnownProductsSheet({ open, onClose, items, names }: KnownProductsSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Tus productos">
      <KnownProducts items={items} names={names} />
    </Sheet>
  )
}

// Inside the sheet, so the search starts empty every time it opens
function KnownProducts({ items, names }: { items: readonly ShoppingItem[]; names: AisleNames }) {
  const [query, setQuery] = useState('')
  // The product whose section is open to pick another
  const [picking, setPicking] = useState<string | null>(null)
  const toast = useToast()
  const key = normalizeName(query)
  const sorted = [...items].sort((a, b) => collator.compare(a.name, b.name))
  const shown = key ? sorted.filter((i) => normalizeName(i.name).includes(key)) : sorted

  async function handleAdd(item: ShoppingItem) {
    await shoppingRepo.addAgain(item.id)
    toast(`${item.name} va a la lista`)
    runSync().catch(() => {})
  }

  async function handleForget(item: ShoppingItem) {
    await shoppingRepo.forget(item.id)
    toast(`Olvidaste ${item.name}`)
    runSync().catch(() => {})
  }

  async function handleAisle(item: ShoppingItem, aisle: AisleId) {
    await shoppingRepo.setAisle(item.id, aisle)
    setPicking(null)
    runSync().catch(() => {})
  }

  return (
    <div className={styles.content}>
      <TextField
        label="Buscar productos"
        hideLabel
        type="search"
        placeholder="Buscar…"
        icon={<Search />}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />
      {shown.length === 0 ? (
        <p className={styles.empty}>
          {items.length === 0 ? 'Lo que compres va a aparecer acá.' : 'Ningún producto coincide.'}
        </p>
      ) : (
        <ul className={styles.list}>
          {shown.map((item) => {
            const onList = item.status !== 'in_stock'
            const open = picking === item.id
            const aisle = aisleOf(item)
            return (
              <li key={item.id} className={styles.item}>
                <div className={styles.row}>
                  <span className={styles.info}>
                    <span className={styles.name}>{item.name}</span>
                    <span className={styles.meta}>
                      <button
                        type="button"
                        className={styles.aisle}
                        aria-expanded={open}
                        aria-label={`Sección de ${item.name}: ${aisleLabel(aisle, names)}. Cambiar`}
                        onClick={() => setPicking(open ? null : item.id)}
                      >
                        {aisleLabel(aisle, names)}
                        <ChevronDown aria-hidden className={cx(open && styles.up)} />
                      </button>
                      {onList
                        ? 'En la lista'
                        : item.lastBoughtAt
                          ? `Comprado ${formatDaysAgo(item.lastBoughtAt)}`
                          : 'Todavía no lo compraste'}
                    </span>
                  </span>
                  {!onList && (
                    <>
                      <IconButton
                        label={`Olvidar ${item.name}`}
                        icon={<Trash2 />}
                        onClick={() => handleForget(item)}
                      />
                      <IconButton
                        label={`Agregar ${item.name} a la lista`}
                        icon={<Plus />}
                        variant="secondary"
                        onClick={() => handleAdd(item)}
                      />
                    </>
                  )}
                </div>
                {open && (
                  <div className={styles.picker}>
                    <AislePicker
                      label={`Sección de ${item.name}`}
                      value={aisle}
                      names={names}
                      onChange={(next) => handleAisle(item, next)}
                    />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
