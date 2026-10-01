import type { CSSProperties } from 'react'
import { getCategory, useCategories } from '../categories'
import styles from './CategoryIcon.module.css'

// The category's icon on a soft disc of its own hue, the same one its charts use
export function CategoryIcon({ category }: { category: string }) {
  useCategories() // re-renders when the user edits their categories
  const { icon: Icon, color } = getCategory(category)
  return (
    <span
      className={styles.icon}
      style={{ '--category-color': color } as CSSProperties}
      aria-hidden
    >
      <Icon />
    </span>
  )
}
