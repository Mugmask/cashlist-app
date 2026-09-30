import { getCategory } from '../categories'
import styles from './CategoryIcon.module.css'

export function CategoryIcon({ category }: { category: string }) {
  const Icon = getCategory(category).icon
  return (
    <span className={styles.icon} aria-hidden>
      <Icon />
    </span>
  )
}
