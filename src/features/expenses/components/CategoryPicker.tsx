import { Settings2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ChipGroup } from '@/ui'
import { getCategory, OTHER_ID, useCategories } from '../categories'
import { rankByUse, useRecentExpenses } from '../categoryUsage'
import { CategoriesSheet } from './CategoriesSheet'
import styles from './CategoryPicker.module.css'

export interface CategoryPickerProps {
  value: string
  onChange: (id: string) => void
  // A new one: starts on the first chip (the most used) once they're ranked
  pickFirst?: boolean
}

// The categories as chips in two rows that scroll sideways, the most used first, so they take
// little of the form. "Editar", the last chip, opens them all to edit, and to make a new one
// there (picked right away). Used by the expense and fixed expense forms.
export function CategoryPicker({ value, onChange, pickFirst }: CategoryPickerProps) {
  const { list } = useCategories()
  const [editing, setEditing] = useState(false)
  const recent = useRecentExpenses()
  // Ranked once, when the expenses load: chips don't move around while picking. One already
  // picked (editing, say) goes first, so it's in sight.
  const [ranked, setRanked] = useState<readonly string[] | null>(null)
  if (ranked === null && recent !== undefined) {
    const ids = rankByUse(list, recent).map((c) => c.id)
    const current = getCategory(value).id
    setRanked(pickFirst ? ids : [current, ...ids.filter((id) => id !== current)])
  }
  // One made after that (just now, from here) goes first; deleted ones drop out
  const ordered = ranked
    ? [
        ...list.filter((c) => !ranked.includes(c.id)),
        ...ranked.flatMap((id) => list.find((c) => c.id === id) ?? []),
      ]
    : list
  // Once, when ranked: a chip tapped before that stays picked
  const settled = useRef(!pickFirst)
  useEffect(() => {
    if (settled.current || !ranked?.[0]) return
    settled.current = true
    onChange(ranked[0])
  }, [ranked, onChange])
  const picked = getCategory(value).id // unknown or deleted ones show (and save) as Otros

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
      <div className={styles.scroller}>
        <ChipGroup
          label="Categoría"
          rows={2}
          options={options}
          value={picked}
          onChange={(id) => {
            settled.current = true
            onChange(id)
          }}
          after={
            <button type="button" className={styles.edit} onClick={() => setEditing(true)}>
              <Settings2 aria-hidden />
              Editar
            </button>
          }
        />
      </div>
      <CategoriesSheet
        open={editing}
        startWith="list"
        onClose={() => setEditing(false)}
        onCreated={onChange}
        onDeleted={(id) => id === value && onChange(OTHER_ID)}
      />
    </div>
  )
}
