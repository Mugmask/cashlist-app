import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import {
  CategoryIcon,
  ExpenseRow,
  getCategory,
  isFixed,
  totalsByCategory,
  type MonthExpense,
} from '@/features/expenses'
import { Amount, cx, ProgressBar } from '@/ui'
import { Change } from './Change'
import styles from './CategoryBreakdown.module.css'

export interface CategoryBreakdownProps {
  expenses: readonly MonthExpense[]
  changes: ReadonlyMap<string, number> // vs the month before, by category
  onOpenExpense: (id: string) => void
}

// Every category of variable spending, biggest first: its share as a bar, the percentage and
// the change from the month before. Tapping one lists its expenses right there.
export function CategoryBreakdown({ expenses, changes, onOpenExpense }: CategoryBreakdownProps) {
  const [open, setOpen] = useState<string | null>(null)
  const variable = expenses.filter((e) => !isFixed(e))
  const total = variable.reduce((sum, e) => sum + e.amount, 0)

  return (
    <ul className={styles.list}>
      {totalsByCategory(variable).map((c) => {
        const { label, color } = getCategory(c.category)
        const share = Math.round((c.total / total) * 100)
        const isOpen = open === c.category
        const listId = `category-${c.category}`
        return (
          <li key={c.category} className={styles.item}>
            <button
              type="button"
              className={styles.summary}
              aria-expanded={isOpen}
              aria-controls={listId}
              onClick={() => setOpen(isOpen ? null : c.category)}
            >
              <CategoryIcon category={c.category} />
              <span className={styles.body}>
                <span className={styles.line}>
                  <span className={styles.label}>{label}</span>
                  <Amount value={c.total} size="sm" compactFrom={10_000_000} />
                </span>
                <ProgressBar
                  label={`${label}: ${share}% de lo variable`}
                  value={c.total}
                  max={total}
                  tone="accent"
                  color={color}
                />
                <span className={styles.meta}>
                  <span>
                    {share}% · {c.count === 1 ? '1 gasto' : `${c.count} gastos`}
                  </span>
                  <Change value={changes.get(c.category)} />
                </span>
              </span>
              <ChevronDown aria-hidden className={cx(styles.chevron, isOpen && styles.flipped)} />
            </button>
            {isOpen && (
              <ul id={listId} className={styles.expenses}>
                {variable
                  .filter((e) => e.category === c.category)
                  .sort((a, b) => b.amount - a.amount)
                  .map((e) => (
                    <ExpenseRow key={e.id} expense={e} onOpen={onOpenExpense} />
                  ))}
              </ul>
            )}
          </li>
        )
      })}
    </ul>
  )
}
