import { RotateCcw } from 'lucide-react'
import { useState, type CSSProperties, type FormEvent } from 'react'
import { runSync } from '@/lib/sync'
import {
  Alert,
  Button,
  ColorField,
  OptionGrid,
  RainbowSwatch,
  Stack,
  TextField,
  useToast,
} from '@/ui'
import { colorDistance, contrast } from '@/utils/color'
import { capitalize } from '@/utils/text'
import { BUILT_IN_CATEGORIES, useCategories, type Category } from '../categories'
import { categoriesRepo, isNameTaken, MAX_CATEGORY_NAME, nextColor } from '../categoriesRepo'
import {
  CATEGORY_ICONS,
  categoryColor,
  colorIndexOf,
  DEFAULT_ICON,
  iconKeyOf,
  PICKABLE_COLORS,
} from '../categoryIcons'
import styles from './CategoryForm.module.css'

// Closer than this (OKLab), two categories are hard to tell apart in a chart
const TOO_ALIKE = 0.06
// Below this against the background, an icon or a chart bar is hard to see (WCAG non-text)
const MIN_GRAPHIC_CONTRAST = 3
const BACKGROUND = '#141519' // the cards'

// A palette color as tokens.css draws it
function paletteHex(index: number) {
  return getComputedStyle(document.documentElement).getPropertyValue(`--color-cat-${index}`).trim()
}

// What a category looks like right now, as #rrggbb: its exact color, or its palette one
function shownColor(category: Category) {
  const exact = (category.own ?? category.custom)?.customColor
  return exact ?? paletteHex(colorIndexOf(category.color))
}

export interface CategoryFormProps {
  // Editing when set (one of the user's, or a built-in one), creating otherwise
  category?: Category
  onSaved: (id: string) => void
}

// Name, icon and color of a category: one the user makes, or a built-in one (which can then go
// back to the original). The icons show in the picked color, so the grid is also the preview.
export function CategoryForm({ category, onSaved }: CategoryFormProps) {
  const toast = useToast()
  const { list } = useCategories()
  const own = category?.own
  const builtIn = category && !own ? category : undefined
  const [name, setName] = useState(own?.name ?? builtIn?.label ?? '')
  // A built-in one opens on the icon it shows: the app's, or the one the user gave it
  const [icon, setIcon] = useState(own?.icon ?? (builtIn ? iconKeyOf(builtIn.icon) : DEFAULT_ICON))
  const [color, setColor] = useState(() =>
    own ? own.color : builtIn ? colorIndexOf(builtIn.color) : nextColor(list),
  )
  // An exact color over the palette: picked with "Personalizado", kept while back on the palette
  const saved = (own ?? builtIn?.custom)?.customColor
  const [exact, setExact] = useState(saved !== undefined)
  const [hex, setHex] = useState(() => saved ?? paletteHex(color))
  // The category that looks the most like the exact color, if too much
  const lookalike = exact
    ? list
        .filter((c) => c.id !== category?.id)
        .map((c) => ({ category: c, distance: colorDistance(hex, shownColor(c)) }))
        .sort((a, b) => a.distance - b.distance)
        .find((c) => c.distance < TOO_ALIKE)?.category
    : undefined
  const faint = exact && contrast(hex, BACKGROUND) < MIN_GRAPHIC_CONTRAST

  function pickColor(next: number | 'custom') {
    if (next === 'custom') {
      // Starts from the palette color it had, so the picker opens on something familiar
      if (!exact && saved === undefined) setHex(paletteHex(color))
      setExact(true)
      return
    }
    setExact(false)
    setColor(next)
  }

  const clean = capitalize(name.trim())
  const taken = clean !== '' && isNameTaken(clean, list, category?.id)
  const isValid = clean !== '' && !taken

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    // This form can open from inside the expense form: its submit must not reach that one
    e.stopPropagation()
    if (!isValid) return
    const customColor = exact ? hex : undefined // undefined: back to the palette's
    if (builtIn) {
      await categoriesRepo.customizeBuiltIn(builtIn, { name: clean, icon, color, customColor })
    }
    const input = { name: clean, icon, color, customColor }
    const id = category ? category.id : await categoriesRepo.create(input)
    if (own) await categoriesRepo.update(own.id, input)
    toast(category ? 'Categoría guardada' : `Categoría ${clean} creada`)
    runSync().catch(() => {}) // on failure it stays pending and retries on its own
    onSaved(id)
  }

  async function handleReset() {
    if (!builtIn) return
    await categoriesRepo.resetBuiltIn(builtIn.id)
    const original = BUILT_IN_CATEGORIES.find((c) => c.id === builtIn.id)?.label
    toast(`${original} volvió a como venía`)
    runSync().catch(() => {})
    onSaved(builtIn.id)
  }

  // Green isn't offered any more, but one that already is keeps showing it as picked
  const colors: readonly number[] = PICKABLE_COLORS.includes(color as never)
    ? PICKABLE_COLORS
    : [...PICKABLE_COLORS, color].sort((a, b) => a - b)

  const tint = {
    '--option-color': exact ? hex : categoryColor(color),
  } as CSSProperties

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
        <Stack gap={3}>
          <OptionGrid<number | 'custom'>
            label="Color"
            className={styles.colors}
            options={[
              ...colors.map((index) => ({
                value: index,
                label: `Color ${index}`,
                content: (
                  <span
                    className={styles.swatch}
                    style={{ background: categoryColor(index) }}
                    aria-hidden
                  />
                ),
              })),
              { value: 'custom' as const, label: 'Personalizado', content: <RainbowSwatch /> },
            ]}
            value={exact ? 'custom' : color}
            onChange={pickColor}
          />
          {exact && (
            <>
              <ColorField value={hex} onChange={setHex} />
              {lookalike ? (
                <Alert>
                  Se parece mucho a {lookalike.label}: en los gráficos va a costar distinguirlas.
                </Alert>
              ) : (
                faint && <Alert>Ese color se ve poco sobre el fondo: probá uno más fuerte.</Alert>
              )}
            </>
          )}
        </Stack>
        <Button type="submit" size="lg" fullWidth disabled={!isValid}>
          {category ? 'Guardar cambios' : 'Crear categoría'}
        </Button>
        {builtIn?.custom && (
          <Button
            variant="ghost"
            size="lg"
            fullWidth
            icon={<RotateCcw aria-hidden />}
            onClick={handleReset}
          >
            Volver al original
          </Button>
        )}
      </Stack>
    </form>
  )
}
