import { useLiveQuery } from 'dexie-react-hooks'
import { Trash2 } from 'lucide-react'
import { runSync } from '@/lib/sync'
import { Button, Sheet, Stack, useToast } from '@/ui'
import { incomesRepo } from '../incomesRepo'
import { IncomeForm } from './IncomeForm'

export interface IncomeSheetProps {
  incomeId: string | null // null = closed
  onClose: () => void
}

// One income, straight to its form (there's little else to show about it), with delete
export function IncomeSheet({ incomeId, onClose }: IncomeSheetProps) {
  const toast = useToast()
  const income = useLiveQuery(() => (incomeId ? incomesRepo.get(incomeId) : undefined), [incomeId])
  // Deleted elsewhere (another device, via sync) while open: nothing left to show
  const visible = income && !income.deleted ? income : null

  async function handleDelete() {
    if (!visible) return
    await incomesRepo.remove(visible.id)
    toast('Ingreso borrado')
    runSync().catch(() => {})
    onClose()
  }

  return (
    <Sheet open={incomeId !== null && visible !== null} onClose={onClose} title="Editar ingreso">
      {visible && (
        <Stack gap={3}>
          {/* Keyed so opening another income starts from its own values */}
          <IncomeForm key={visible.id} income={visible} onSaved={onClose} />
          <Button
            variant="danger"
            size="lg"
            fullWidth
            icon={<Trash2 aria-hidden />}
            onClick={handleDelete}
          >
            Borrar ingreso
          </Button>
        </Stack>
      )}
    </Sheet>
  )
}
