import { Check, Plus, X } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import type { Recipe, RecipeIngredient } from '@/lib/db'
import { runSync } from '@/lib/sync'
import { Alert, Button, cx, IconButton, Sheet, Stack, TextField, useToast } from '@/ui'
import { capitalize } from '@/utils/text'
import { parseItemInput } from '../items'
import { productSuggestions, withIngredient } from '../recipes'
import { recipesRepo } from '../recipesRepo'
import styles from './RecipeSheet.module.css'

export interface RecipeSheetProps {
  open: boolean
  recipe?: Recipe // set: cooking it (and editing it from there); missing: a new one
  products: readonly string[] // names already on the list or bought, to suggest
  onClose: () => void
}

// A recipe: cook it (tick off what's at home, the rest goes on the list) or edit it.
export function RecipeSheet({ open, recipe: current, products, onClose }: RecipeSheetProps) {
  const [editing, setEditing] = useState(false)
  // While it slides down (closed, or its recipe just deleted) it keeps showing the last one
  const [recipe, setRecipe] = useState(current)
  if (open && current !== recipe) setRecipe(current)
  const showForm = !recipe || editing

  function close() {
    setEditing(false) // the next time it opens on its recipe again
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={close}
      title={!recipe ? 'Nueva receta' : editing ? 'Editar receta' : recipe.name}
    >
      {showForm ? (
        <RecipeForm
          recipe={recipe}
          products={products}
          onDone={() => (recipe ? setEditing(false) : close())}
          onDeleted={close}
        />
      ) : (
        <Cook recipe={recipe} onEdit={() => setEditing(true)} onDone={close} />
      )}
    </Sheet>
  )
}

// "¿Qué te falta?": every ingredient ticked; untick what's already at home
function Cook({
  recipe,
  onEdit,
  onDone,
}: {
  recipe: Recipe
  onEdit: () => void
  onDone: () => void
}) {
  const toast = useToast()
  const [have, setHave] = useState(() => new Set<string>())
  const [busy, setBusy] = useState(false) // a double tap would add everything twice
  const missing = recipe.ingredients.filter((i) => !have.has(i.name))

  function toggle(name: string) {
    setHave((current) => {
      const next = new Set(current)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  async function handleAdd() {
    if (busy) return
    setBusy(true)
    const count = await recipesRepo.cook(missing)
    toast(count === 1 ? '1 ingrediente a la lista' : `${count} ingredientes a la lista`)
    runSync().catch(() => {})
    onDone()
  }

  if (recipe.ingredients.length === 0) {
    return (
      <Stack gap={4}>
        <p className={styles.hint}>Esta receta todavía no tiene ingredientes.</p>
        <Button size="lg" fullWidth onClick={onEdit}>
          Agregar ingredientes
        </Button>
      </Stack>
    )
  }

  return (
    <Stack gap={4}>
      <p className={styles.hint}>Destildá lo que ya tenés en casa: el resto va a la lista.</p>
      <ul className={styles.list} aria-label="Ingredientes">
        {recipe.ingredients.map((i) => {
          const needed = !have.has(i.name)
          return (
            <li key={i.name}>
              <button
                type="button"
                role="checkbox"
                aria-checked={needed}
                className={cx(styles.toggle, !needed && styles.have)}
                onClick={() => toggle(i.name)}
              >
                <span className={styles.box} aria-hidden>
                  {needed && <Check />}
                </span>
                <span className={styles.name}>{i.name}</span>
                {i.quantity > 1 && <span className={styles.quantity}>x{i.quantity}</span>}
                {!needed && <span className={styles.haveLabel}>Lo tengo</span>}
              </button>
            </li>
          )
        })}
      </ul>
      <Stack gap={2}>
        <Button
          size="lg"
          fullWidth
          disabled={missing.length === 0}
          loading={busy}
          onClick={handleAdd}
        >
          {missing.length === 0
            ? 'Tenés todo'
            : missing.length === 1
              ? 'Agregar 1 a la lista'
              : `Agregar ${missing.length} a la lista`}
        </Button>
        <Button variant="ghost" size="lg" fullWidth onClick={onEdit}>
          Editar receta
        </Button>
      </Stack>
    </Stack>
  )
}

function RecipeForm({
  recipe,
  products,
  onDone,
  onDeleted,
}: {
  recipe?: Recipe
  products: readonly string[]
  onDone: () => void
  onDeleted: () => void
}) {
  const toast = useToast()
  const [name, setName] = useState(recipe?.name ?? '')
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(recipe?.ingredients ?? [])
  const [typed, setTyped] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [busy, setBusy] = useState(false) // a double tap would create the recipe twice
  const parsed = parseItemInput(typed)
  const suggestions = productSuggestions(products, parseItemInput(typed)?.name ?? '', ingredients)
  const clean = capitalize(name.trim())

  function add(item = parsed) {
    if (!item) return
    setIngredients((current) => withIngredient(current, item))
    setTyped('')
  }

  // Enter in the ingredient field adds it (there's no form to submit: the sheet has two fields
  // with an action each)
  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    add()
  }

  async function handleSave() {
    if (!clean || busy) return
    setBusy(true)
    const input = { name: clean, ingredients }
    if (recipe) await recipesRepo.update(recipe.id, input)
    else await recipesRepo.create(input)
    toast(recipe ? 'Receta guardada' : `Receta ${clean} creada`)
    runSync().catch(() => {}) // on failure it stays pending and retries on its own
    onDone()
  }

  async function handleDelete() {
    if (!recipe) return
    await recipesRepo.remove(recipe.id)
    toast(`${recipe.name} eliminada`)
    runSync().catch(() => {})
    onDeleted()
  }

  return (
    <Stack gap={4}>
      <TextField
        label="Nombre"
        autoCapitalize="sentences"
        placeholder="Milanesas con puré, tarta de verdura…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="off"
        autoFocus={!recipe}
      />

      <div className={styles.ingredients}>
        <span className={styles.label}>Ingredientes</span>
        {ingredients.length > 0 && (
          <ul className={styles.list}>
            {ingredients.map((i) => (
              <li key={i.name} className={styles.row}>
                <span className={styles.name}>{i.name}</span>
                {i.quantity > 1 && <span className={styles.quantity}>x{i.quantity}</span>}
                <IconButton
                  label={`Sacar ${i.name}`}
                  icon={<X />}
                  onClick={() => setIngredients((current) => current.filter((x) => x !== i))}
                />
              </li>
            ))}
          </ul>
        )}
        <div className={styles.add}>
          <TextField
            label="Agregar ingrediente"
            hideLabel
            placeholder="Agregar… (ej: papa x4)"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={onKeyDown}
            enterKeyHint="done"
            autoComplete="off"
            className={styles.addField}
          />
          <IconButton
            label="Agregar ingrediente"
            icon={<Plus />}
            variant="accent"
            disabled={!parsed}
            onClick={() => add()}
          />
        </div>
        {suggestions.length > 0 && (
          <div className={styles.suggestions} role="group" aria-label="Tus productos">
            {suggestions.map((product) => (
              <button
                key={product}
                type="button"
                className={styles.suggestion}
                // Keeps the count typed ("pa x3" → Papa x3)
                onClick={() => add({ name: product, quantity: parsed?.quantity ?? 1 })}
              >
                <Plus aria-hidden />
                {product}
              </button>
            ))}
          </div>
        )}
      </div>

      <Button size="lg" fullWidth disabled={!clean} loading={busy} onClick={handleSave}>
        {recipe ? 'Guardar cambios' : 'Crear receta'}
      </Button>
      {recipe &&
        (confirmingDelete ? (
          <Stack gap={2}>
            <Alert tone="danger">¿Eliminar {recipe.name}? Tu lista de compras no cambia.</Alert>
            <Button variant="danger" size="lg" fullWidth onClick={handleDelete}>
              Eliminar receta
            </Button>
            <Button variant="ghost" size="lg" fullWidth onClick={() => setConfirmingDelete(false)}>
              Cancelar
            </Button>
          </Stack>
        ) : (
          <Button variant="ghost" size="lg" fullWidth onClick={() => setConfirmingDelete(true)}>
            Eliminar receta
          </Button>
        ))}
    </Stack>
  )
}
