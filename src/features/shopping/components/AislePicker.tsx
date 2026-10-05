import { ChipGroup } from '@/ui'
import { AISLES, aisleLabel, type AisleId, type AisleNames } from '../aisles'

export interface AislePickerProps {
  label: string
  value: AisleId
  names: AisleNames
  onChange: (aisle: AisleId) => void
}

// The store sections as chips, with the user's names for them
export function AislePicker({ label, value, names, onChange }: AislePickerProps) {
  const options = AISLES.map((a) => ({ value: a.id, label: aisleLabel(a.id, names) }))
  return <ChipGroup label={label} options={options} value={value} onChange={onChange} />
}
