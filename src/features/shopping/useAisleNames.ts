import { useProfile } from '@/features/profile'
import type { AisleNames } from './aisles'

const NONE: AisleNames = {}

// The user's names for the store sections, from the profile; none while it loads
export function useAisleNames(): AisleNames {
  return useProfile()?.aisleNames ?? NONE
}
