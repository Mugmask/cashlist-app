import { Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { ShoppingItem } from '@/lib/db'
import { runSync } from '@/lib/sync'
import { IconButton, Sheet, TextField, useToast } from '@/ui'
import { formatDaysAgo } from '@/utils/dates'
import { normalizeName } from '@/utils/text'
import { shoppingRepo } from '../shoppingRepo'
import styles from './KnownProductsSheet.module.css'

export interface KnownProductsSheetProps {
  open: boolean
  onClose: () => void
  items: readonly ShoppingItem[] // products off the list, alphabetically
}

// Every product off the list, searchable: add one back, or forget one that's no longer bought
// (so it stops showing among the frequent ones)
export function KnownProductsSheet({ open, onClose, items }: KnownProductsSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Tus productos">
      <KnownProducts items={items} />
    </Sheet>
  )
}

// Inside the sheet, so the search starts empty every time it opens
function KnownProducts({ items }: { items: readonly ShoppingItem[] }) {
  const [query, setQuery] = useState('')
  const toast = useToast()
  const key = normalizeName(query)
  const shown = key ? items.filter((i) => normalizeName(i.name).includes(key)) : items

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
          {shown.map((item) => (
            <li key={item.id} className={styles.row}>
              <span className={styles.info}>
                <span className={styles.name}>{item.name}</span>
                <span className={styles.meta}>
                  {item.lastBoughtAt
                    ? `Comprado ${formatDaysAgo(item.lastBoughtAt)}`
                    : 'Todavía no lo compraste'}
                </span>
              </span>
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
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
