import type { ShoppingItem } from '@/lib/db'
import { runSync } from '@/lib/sync'
import { Sheet, useToast } from '@/ui'
import { aisleLabel, aisleOf, type AisleId, type AisleNames } from '../aisles'
import { shoppingRepo } from '../shoppingRepo'
import { AislePicker } from './AislePicker'

export interface AislePickerSheetProps {
  item: ShoppingItem | null // null = closed
  names: AisleNames
  onClose: () => void
}

// The section of one product, from the toast after adding it ("Cambiar"): one tap moves it
export function AislePickerSheet({ item, names, onClose }: AislePickerSheetProps) {
  const toast = useToast()

  async function pick(aisle: AisleId) {
    if (!item) return
    await shoppingRepo.setAisle(item.id, aisle)
    toast(`${item.name} va en ${aisleLabel(aisle, names)}`)
    runSync().catch(() => {})
    onClose()
  }

  return (
    <Sheet open={item !== null} onClose={onClose} title={item ? `Sección de ${item.name}` : ''}>
      {item && (
        <AislePicker
          label={`Sección de ${item.name}`}
          value={aisleOf(item)}
          names={names}
          onChange={pick}
        />
      )}
    </Sheet>
  )
}
