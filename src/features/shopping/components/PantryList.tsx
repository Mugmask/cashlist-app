import { Trash2 } from 'lucide-react'
import type { ShoppingItem } from '@/lib/db'
import { runSync } from '@/lib/sync'
import { Button, IconButton } from '@/ui'
import { formatDaysAgo } from '@/utils/dates'
import { shoppingRepo } from '../shoppingRepo'
import styles from './PantryList.module.css'

const STATUS_LABEL = { to_buy: 'En la lista', in_cart: 'En el carrito' } as const

// Every product you buy. Marking one as run out puts it on the shopping list.
export function PantryList({ items }: { items: readonly ShoppingItem[] }) {
  async function handleRunOut(id: string) {
    await shoppingRepo.runOut(id)
    runSync().catch(() => {})
  }

  async function handleRemove(id: string) {
    await shoppingRepo.removeProduct(id)
    runSync().catch(() => {})
  }

  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item.id} className={styles.row}>
          <div className={styles.info}>
            <span className={styles.name}>{item.name}</span>
            <span className={styles.meta}>
              {item.lastBoughtAt
                ? `Comprado ${formatDaysAgo(item.lastBoughtAt)}`
                : 'Todavía no lo compraste'}
            </span>
          </div>
          {item.status === 'in_stock' ? (
            <Button variant="secondary" onClick={() => handleRunOut(item.id)}>
              Se acabó
            </Button>
          ) : (
            <span className={styles.badge}>{STATUS_LABEL[item.status]}</span>
          )}
          <IconButton
            label={`Quitar ${item.name} de la despensa`}
            icon={<Trash2 />}
            onClick={() => handleRemove(item.id)}
          />
        </li>
      ))}
    </ul>
  )
}
