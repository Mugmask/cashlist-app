import { ChevronRight, ShoppingBasket } from 'lucide-react'
import { Link } from 'react-router'
import { Card } from '@/ui'
import { useShoppingList } from '../useShoppingList'
import styles from './ShoppingHomeCard.module.css'

const PREVIEW_COUNT = 3

// Pending shopping at a glance on the home screen; hidden when there's nothing to buy
export function ShoppingHomeCard() {
  const list = useShoppingList()

  if (!list || list.toBuy.length === 0) return null

  const { toBuy } = list
  const preview = toBuy.slice(0, PREVIEW_COUNT).map((i) => i.name)
  const rest = toBuy.length - preview.length

  return (
    <Link to="/shopping" className={styles.link}>
      <Card className={styles.card}>
        <span className={styles.icon} aria-hidden>
          <ShoppingBasket />
        </span>
        <div className={styles.text}>
          <strong>
            {toBuy.length === 1
              ? '1 producto para comprar'
              : `${toBuy.length} productos para comprar`}
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
