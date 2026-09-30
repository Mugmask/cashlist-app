import { Check, X } from 'lucide-react'
import type { ShoppingItem } from '@/lib/db'
import { runSync } from '@/lib/sync'
import { cx, IconButton } from '@/ui'
import { shoppingRepo } from '../shoppingRepo'
import styles from './ItemList.module.css'

export function ItemList({ items }: { items: readonly ShoppingItem[] }) {
  async function handleToggle(id: string) {
    await shoppingRepo.toggle(id)
    runSync().catch(() => {})
  }

  async function handleRemove(id: string) {
    await shoppingRepo.removeFromList(id)
    runSync().catch(() => {})
  }

  return (
    <ul className={styles.list}>
      {items.map((item) => {
        const checked = item.status === 'in_cart'
        return (
          <li key={item.id} className={cx(styles.row, checked && styles.checked)}>
            <button
              type="button"
              role="checkbox"
              aria-checked={checked}
              className={styles.toggle}
              onClick={() => handleToggle(item.id)}
            >
              <span className={styles.box} aria-hidden>
                {checked && <Check />}
              </span>
              <span className={styles.name}>{item.name}</span>
              {item.quantity > 1 && <span className={styles.quantity}>x{item.quantity}</span>}
            </button>
            <IconButton
              label={`Quitar ${item.name} de la lista`}
              icon={<X />}
              onClick={() => handleRemove(item.id)}
            />
          </li>
        )
      })}
    </ul>
  )
}
