import { Check, X } from 'lucide-react'
import { useEffect, useRef, type MouseEvent } from 'react'
import type { ShoppingItem } from '@/lib/db'
import { runSync } from '@/lib/sync'
import { cx, IconButton, useToast, VisuallyHidden } from '@/ui'
import { shoppingRepo } from '../shoppingRepo'
import styles from './ItemList.module.css'
import { pendingRefocus, requestRefocus, takeRefocus } from './refocus'

export function ItemList({ items }: { items: readonly ShoppingItem[] }) {
  const toast = useToast()
  const buttons = useRef(new Map<string, HTMLButtonElement>())

  // After a toggle, give focus back to the item in whichever list it landed (see refocus.ts)
  useEffect(() => {
    const id = pendingRefocus()
    const button = id ? buttons.current.get(id) : undefined
    if (button && takeRefocus(id!)) button.focus()
  }, [items])

  async function handleToggle(item: ShoppingItem, event: MouseEvent<HTMLButtonElement>) {
    // Only when the button had focus (keyboard or screen reader), not to steal it on a tap
    if (document.activeElement === event.currentTarget) requestRefocus(item.id)
    await shoppingRepo.toggle(item.id)
    runSync().catch(() => {})
  }

  async function handleRemove(item: ShoppingItem) {
    await shoppingRepo.removeFromList(item.id)
    toast(`Sacaste ${item.name} de la lista`)
    runSync().catch(() => {})
  }

  return (
    <ul className={styles.list}>
      {items.map((item) => {
        const checked = item.status === 'in_cart'
        return (
          <li key={item.id} className={cx(styles.row, checked && styles.checked)}>
            <button
              ref={(el) => {
                if (el) buttons.current.set(item.id, el)
                else buttons.current.delete(item.id)
              }}
              type="button"
              role="checkbox"
              aria-checked={checked}
              className={styles.toggle}
              onClick={(e) => handleToggle(item, e)}
            >
              <span className={styles.box} aria-hidden>
                {checked && <Check />}
              </span>
              <span className={styles.name}>{item.name}</span>
              {item.quantity > 1 && (
                <span className={styles.quantity}>
                  x{item.quantity}
                  <VisuallyHidden> unidades</VisuallyHidden>
                </span>
              )}
            </button>
            <IconButton
              label={`Sacar ${item.name} de la lista`}
              icon={<X />}
              onClick={() => handleRemove(item)}
            />
          </li>
        )
      })}
    </ul>
  )
}
