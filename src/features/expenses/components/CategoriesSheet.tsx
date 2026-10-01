import { Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { runSync } from '@/lib/sync'
import { Button, EmptyState, IconButton, Sheet, Stack, useToast } from '@/ui'
import { useCategories, type Category } from '../categories'
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

// The user's categories: make new ones, edit or delete them. Rendered on <body>: it opens from
// inside other forms, and a form can't be inside another.
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

  function handleSaved(id: string, created: boolean) {
    if (created) onCreated?.(id)
    // Opened just to make one: done. From the list: back to it.
    if (startWith === 'create') close()
    else setView({ kind: 'list' })
  }

  const title =
    shown.kind === 'list'
      ? 'Tus categorías'
      : shown.category
        ? 'Editar categoría'
        : 'Nueva categoría'

  return createPortal(
    <Sheet open={open} onClose={close} title={title}>
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
  const own = useCategories().list.filter((c) => c.own)
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
    <Stack gap={4}>
      {own.length === 0 ? (
        <EmptyState
          icon={<Tags />}
          title="Todavía no creaste categorías"
          description="Las que vienen de base siguen estando. Sumá las tuyas: nafta, cine, facultad…"
        />
      ) : (
        <ul className={styles.list}>
          {own.map((category) =>
            confirmingId === category.id ? (
              <li key={category.id} className={styles.confirm}>
                <p className={styles.question}>
                  ¿Eliminar {category.label}? Sus gastos pasan a Otros.
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
    </Stack>
  )
}
