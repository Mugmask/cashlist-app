import { Plus, Settings2 } from 'lucide-react'
import { useState } from 'react'
import { ChipGroup } from '@/ui'
import { getCategory, OTHER_ID, useCategories } from '../categories'
import { CategoriesSheet } from './CategoriesSheet'
import styles from './CategoryPicker.module.css'

export interface CategoryPickerProps {
  value: string
  onChange: (id: string) => void
}

// The categories as chips, plus making a new one (picked right away) and editing the user's
// ones. Used by the expense and fixed expense forms.
export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const { list } = useCategories()
  const [sheet, setSheet] = useState<'list' | 'create' | null>(null)
  const hasOwn = list.some((c) => c.own)

  const options = list.map(({ id, label, icon: Icon }) => ({
    value: id,
    label,
    icon: <Icon aria-hidden />,
  }))

  return (
    <div className={styles.picker}>
      <ChipGroup
        label="Categoría"
        showLabel
        options={options}
        // Unknown or deleted ones show (and save) as Otros
        value={getCategory(value).id}
        onChange={onChange}
      />
      <div className={styles.actions}>
        <button type="button" className={styles.action} onClick={() => setSheet('create')}>
          <Plus aria-hidden />
          Nueva categoría
        </button>
        {hasOwn && (
          <button type="button" className={styles.action} onClick={() => setSheet('list')}>
            <Settings2 aria-hidden />
            Editar categorías
          </button>
        )}
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
