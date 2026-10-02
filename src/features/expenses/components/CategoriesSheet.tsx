import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { runSync } from '@/lib/sync'
import { Button, IconButton, Sheet, Stack, useToast } from '@/ui'
import { getCategory, OTHER_ID, useCategories, type Category } from '../categories'
import { categoriesRepo } from '../categoriesRepo'
import { CategoryForm } from './CategoryForm'
import { CategoryIcon } from './CategoryIcon'
import styles from './CategoriesSheet.module.css'

type View = { kind: 'list' } | { kind: 'form'; category?: Category }

export interface CategoriesSheetProps {
  open: boolean
  // 'create' opens straight on a new category; 'list' on the user's ones, to edit them
  startWith: 'list' | 'create'
  onClose: () => void
  onCreated?: (id: string) => void
  onDeleted?: (id: string) => void
}

// The categories: make new ones, edit or delete the user's, rename or recolor the built-in
// ones. Rendered on <body>: it opens from inside other forms, and a form can't be inside
// another.
export function CategoriesSheet({
  open,
  startWith,
  onClose,
  onCreated,
  onDeleted,
}: CategoriesSheetProps) {
  const [view, setView] = useState<View | null>(null)
  const shown: View = view ?? (startWith === 'create' ? { kind: 'form' } : { kind: 'list' })

  function close() {
    setView(null) // the next time it opens on its own start again
    onClose()
  }

  // Closing a form opened from the list goes back to the list, not out of the sheet
  function handleClose() {
    if (shown.kind === 'form' && startWith === 'list') setView({ kind: 'list' })
    else close()
  }

  function handleSaved(id: string, created: boolean) {
    if (created) onCreated?.(id)
    // Opened just to make one: done. From the list: back to it.
    if (startWith === 'create') close()
    else setView({ kind: 'list' })
  }

  const title =
    shown.kind === 'list' ? 'Categorías' : shown.category ? 'Editar categoría' : 'Nueva categoría'

  return createPortal(
    <Sheet open={open} onClose={handleClose} title={title}>
      {shown.kind === 'list' ? (
        <CategoryList
          onCreate={() => setView({ kind: 'form' })}
          onEdit={(category) => setView({ kind: 'form', category })}
          onDeleted={onDeleted}
        />
      ) : (
        <CategoryForm
          category={shown.category}
          onSaved={(id) => handleSaved(id, !shown.category)}
        />
      )}
    </Sheet>,
    document.body,
  )
}

function CategoryList({
  onCreate,
  onEdit,
  onDeleted,
}: {
  onCreate: () => void
  onEdit: (category: Category) => void
  onDeleted?: (id: string) => void
}) {
  const toast = useToast()
  const { list } = useCategories()
  const builtIn = list.filter((c) => !c.own)
  const own = list.filter((c) => c.own)
  // Deleting asks first, on the row itself
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  async function handleDelete(category: Category) {
    await categoriesRepo.remove(category.id)
    setConfirmingId(null)
    toast(`${category.label} eliminada`)
    runSync().catch(() => {})
    onDeleted?.(category.id)
  }

  return (
    <Stack gap={6}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Las tuyas</h3>
        {own.length === 0 ? (
          <p className={styles.empty}>Todavía no creaste ninguna: nafta, cine, facultad…</p>
        ) : (
          <ul className={styles.list}>
            {own.map((category) =>
              confirmingId === category.id ? (
                <li key={category.id} className={styles.confirm}>
                  <p className={styles.question}>
                    ¿Eliminar {category.label}? Sus gastos pasan a {getCategory(OTHER_ID).label}.
                  </p>
                  <div className={styles.confirmActions}>
                    <Button variant="ghost" onClick={() => setConfirmingId(null)}>
                      Cancelar
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(category)}>
                      Eliminar
                    </Button>
                  </div>
                </li>
              ) : (
                <li key={category.id} className={styles.row}>
                  <CategoryIcon category={category.id} />
                  <span className={styles.name}>{category.label}</span>
                  <IconButton
                    label={`Editar ${category.label}`}
                    icon={<Pencil />}
                    onClick={() => onEdit(category)}
                  />
                  <IconButton
                    label={`Eliminar ${category.label}`}
                    icon={<Trash2 />}
                    onClick={() => setConfirmingId(category.id)}
                  />
                </li>
              ),
            )}
          </ul>
        )}
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          icon={<Plus aria-hidden />}
          onClick={onCreate}
        >
          Nueva categoría
        </Button>
      </section>
      {/* The app's own: they can't go (expenses rely on them), but their name and color can */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Las que vienen con la app</h3>
        <ul className={styles.list}>
          {builtIn.map((category) => (
            <li key={category.id} className={styles.row}>
              <CategoryIcon category={category.id} />
              <span className={styles.name}>{category.label}</span>
              <IconButton
                label={`Editar ${category.label}`}
                icon={<Pencil />}
                onClick={() => onEdit(category)}
              />
            </li>
          ))}
        </ul>
      </section>
    </Stack>
  )
}
