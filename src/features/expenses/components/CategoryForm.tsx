import { useState, type CSSProperties, type FormEvent } from 'react'
import { runSync } from '@/lib/sync'
import { Button, OptionGrid, Stack, TextField, useToast } from '@/ui'
import { capitalize } from '@/utils/text'
import { useCategories, type Category } from '../categories'
import { categoriesRepo, isNameTaken, MAX_CATEGORY_NAME, nextColor } from '../categoriesRepo'
import { CATEGORY_COLOR_COUNT, CATEGORY_ICONS, categoryColor, DEFAULT_ICON } from '../categoryIcons'
import styles from './CategoryForm.module.css'

const COLOR_INDEXES = Array.from({ length: CATEGORY_COLOR_COUNT }, (_, i) => i + 1)

export interface CategoryFormProps {
  category?: Category // editing one of the user's when set, creating otherwise
  onSaved: (id: string) => void
}

// Name, icon and color of a category the user makes. The icons show in the picked color, so
// the grid is also the preview.
export function CategoryForm({ category, onSaved }: CategoryFormProps) {
  const toast = useToast()
  const { list } = useCategories()
  const own = category?.own
  const [name, setName] = useState(own?.name ?? '')
  const [icon, setIcon] = useState(own?.icon ?? DEFAULT_ICON)
  const [color, setColor] = useState(() => own?.color ?? nextColor(list))

  const clean = capitalize(name.trim())
  const taken = clean !== '' && isNameTaken(clean, list, category?.id)
  const isValid = clean !== '' && !taken

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    // This form can open from inside the expense form: its submit must not reach that one
    e.stopPropagation()
    if (!isValid) return
    const input = { name: clean, icon, color }
    const id = category ? category.id : await categoriesRepo.create(input)
    if (category) await categoriesRepo.update(category.id, input)
    toast(category ? 'Categoría guardada' : `Categoría ${clean} creada`)
    runSync().catch(() => {}) // on failure it stays pending and retries on its own
    onSaved(id)
  }

  const tint = { '--option-color': categoryColor(color) } as CSSProperties

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={4}>
        <TextField
          label="Nombre"
          autoCapitalize="sentences"
          placeholder="Nafta, cine, facultad…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_CATEGORY_NAME}
          error={taken ? 'Ya hay una categoría con ese nombre' : null}
          autoComplete="off"
          autoFocus={!category}
          required
        />
        <OptionGrid
          label="Ícono"
          className={styles.icons}
          options={Object.entries(CATEGORY_ICONS).map(([key, { icon: Icon, label }]) => ({
            value: key,
            label,
            content: <Icon aria-hidden />,
            style: tint,
          }))}
          value={icon}
          onChange={setIcon}
        />
        <OptionGrid
          label="Color"
          options={COLOR_INDEXES.map((index) => ({
            value: index,
            label: `Color ${index}`,
            content: (
              <span
                className={styles.swatch}
                style={{ background: categoryColor(index) }}
                aria-hidden
              />
            ),
          }))}
          value={color}
          onChange={setColor}
        />
        <Button type="submit" size="lg" fullWidth disabled={!isValid}>
          {category ? 'Guardar cambios' : 'Crear categoría'}
        </Button>
      </Stack>
    </form>
  )
}
