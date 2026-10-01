import { ChevronRight, ShoppingBasket } from 'lucide-react'
import { Link } from 'react-router'
import { Card } from '@/ui'
import type { ShoppingList } from '../useShoppingList'
import styles from './ShoppingHomeCard.module.css'

const PREVIEW_COUNT = 3

// The shopping list at a glance on the home screen; hidden when there's nothing on it
export function ShoppingHomeCard({ list }: { list: ShoppingList }) {
  if (list.toBuy.length + list.inCart.length === 0) return null

  // What's on the list, the missing ones first (the cart may be half full)
  const onList = [...list.toBuy, ...list.inCart]
  const preview = onList.slice(0, PREVIEW_COUNT).map((i) => i.name)
  const rest = onList.length - preview.length

  return (
    <Link to="/shopping" className={styles.link}>
      <Card className={styles.card}>
        <span className={styles.icon} aria-hidden>
          <ShoppingBasket />
        </span>
        <div className={styles.text}>
          <strong>
            {onList.length === 1
              ? '1 producto para comprar'
              : `${onList.length} productos para comprar`}
          </strong>
          <span className={styles.preview}>
            {preview.join(', ')}
            {rest > 0 && ` y ${rest} más`}
          </span>
        </div>
        <ChevronRight aria-hidden className={styles.chevron} />
      </Card>
    </Link>
  )
}
