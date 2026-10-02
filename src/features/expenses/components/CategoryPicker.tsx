import { Plus, Settings2 } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'
import { ChipGroup } from '@/ui'
import { getCategory, OTHER_ID, useCategories } from '../categories'
import { rankByUse, useRecentExpenses } from '../categoryUsage'
import { CategoriesSheet } from './CategoriesSheet'
import styles from './CategoryPicker.module.css'

export interface CategoryPickerProps {
  value: string
  onChange: (id: string) => void
}

// The categories as chips in two rows that scroll sideways, the most used first, so they take
// little of the form; making a new one (picked right away) and editing them (the user's, and
// the built-in ones' name, icon and color) close the rows. Used by the expense and fixed
// expense forms.
export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const { list } = useCategories()
  const [sheet, setSheet] = useState<'list' | 'create' | null>(null)
  const recent = useRecentExpenses()
  // Ranked once, when the expenses load: chips don't move around while picking
  const [ranked, setRanked] = useState<readonly string[] | null>(null)
  if (ranked === null && recent !== undefined) setRanked(rankByUse(list, recent).map((c) => c.id))
  // One made after that (just now, from here) goes first; deleted ones drop out
  const ordered = ranked
    ? [
        ...list.filter((c) => !ranked.includes(c.id)),
        ...ranked.flatMap((id) => list.find((c) => c.id === id) ?? []),
      ]
    : list
  const picked = getCategory(value).id // unknown or deleted ones show (and save) as Otros

  // The picked one in sight once ranked: it may sit past the first columns
  const scroller = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const row = scroller.current
    const chip = row?.querySelector<HTMLElement>('[aria-checked="true"]')
    if (!row || !chip) return
    const left = chip.offsetLeft - row.offsetLeft
    if (left + chip.offsetWidth > row.clientWidth) row.scrollLeft = left - row.clientWidth / 3
  }, [ranked])

  const options = ordered.map(({ id, label, icon: Icon }) => ({
    value: id,
    label,
    icon: <Icon aria-hidden />,
  }))

  return (
    <div className={styles.picker}>
      <span className={styles.label} aria-hidden>
        Categoría
      </span>
      <div ref={scroller} className={styles.scroller}>
        <ChipGroup
          label="Categoría"
          className={styles.chips}
          options={options}
          value={picked}
          onChange={onChange}
        />
        <div className={styles.actions}>
          <button type="button" className={styles.action} onClick={() => setSheet('create')}>
            <Plus aria-hidden />
            Nueva
          </button>
          <button type="button" className={styles.action} onClick={() => setSheet('list')}>
            <Settings2 aria-hidden />
            Editar
          </button>
        </div>
      </div>
      <CategoriesSheet
        open={sheet !== null}
        startWith={sheet ?? 'list'}
        onClose={() => setSheet(null)}
        onCreated={onChange}
        onDeleted={(id) => id === value && onChange(OTHER_ID)}
      />
    </div>
  )
}
