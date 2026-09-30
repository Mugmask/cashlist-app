import { ChevronRight } from 'lucide-react'
import { CategoryIcon, getCategory } from '@/features/expenses'
import { cx, ProgressBar } from '@/ui'
import { formatCurrencyShort } from '@/utils/currency'
import type { BudgetLine, UnbudgetedCategory } from '../overview'
import styles from './BudgetList.module.css'

export function BudgetLineList({
  lines,
  onSelect,
}: {
  lines: readonly BudgetLine[]
  onSelect: (category: string) => void
}) {
  return (
    <ul className={styles.list}>
      {lines.map((line) => {
        const { label } = getCategory(line.category)
        const isOver = line.remaining < 0
        const status = isOver
          ? `Te pasaste ${formatCurrencyShort(-line.remaining)}`
          : line.remaining === 0
            ? 'Llegaste al tope'
            : `Quedan ${formatCurrencyShort(line.remaining)}`
        return (
          <li key={line.category}>
            <button type="button" className={styles.row} onClick={() => onSelect(line.category)}>
              <CategoryIcon category={line.category} />
              <div className={styles.body}>
                <div className={styles.line}>
                  <span className={styles.title}>{label}</span>
                  <span className={cx(styles.status, isOver && styles.over)}>{status}</span>
                </div>
                <ProgressBar
                  label={`${label}: ${Math.round(line.ratio * 100)}% usado`}
                  value={line.spent}
                  max={line.limit}
                />
                <span className={styles.meta}>
                  {formatCurrencyShort(line.spent)} de {formatCurrencyShort(line.limit)}
                </span>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export function UnbudgetedList({
  categories,
  onSelect,
}: {
  categories: readonly UnbudgetedCategory[]
  onSelect: (category: string) => void
}) {
  return (
    <ul className={styles.list}>
      {categories.map(({ category, spent }) => {
        const { label } = getCategory(category)
        return (
          <li key={category}>
            <button type="button" className={styles.row} onClick={() => onSelect(category)}>
              <CategoryIcon category={category} />
              <div className={styles.body}>
                <span className={styles.title}>{label}</span>
                <span className={styles.meta}>
                  {spent > 0
                    ? `Gastaste ${formatCurrencyShort(spent)} este mes`
                    : 'Sin gastos este mes'}
                </span>
              </div>
              <span className={styles.define}>
                Definir
                <ChevronRight aria-hidden />
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
