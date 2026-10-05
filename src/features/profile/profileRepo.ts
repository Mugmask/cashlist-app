import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Profile } from '@/lib/db'

const ID = 'me' // a single row per user

export interface ProfileFields {
  name?: string
  monthlyIncome?: number // pesos
}

export const profileRepo = {
  // Replaces the name and income: one left out is cleared. The section names (the shopping
  // list's) are kept: they're edited apart, see saveAisleNames.
  async save(fields: ProfileFields, now = new Date()) {
    const current = await profileRepo.get()
    await db.profile.put({
      ...fields,
      aisleNames: current?.aisleNames,
      id: ID,
      updatedAt: now.toISOString(),
      deleted: false,
      pending: 1,
    })
  },

  get() {
    return db.profile.get(ID)
  },

  // The user's names for the shopping list's sections, keeping the rest of the profile. Empty
  // clears them all (back to the app's).
  async saveAisleNames(aisleNames: Record<string, string>, now = new Date()) {
    const current = await profileRepo.get()
    await db.profile.put({
      name: current?.name,
      monthlyIncome: current?.monthlyIncome,
      aisleNames: Object.keys(aisleNames).length > 0 ? aisleNames : undefined,
      id: ID,
      updatedAt: now.toISOString(),
      deleted: false,
      pending: 1,
    })
  },

  // Changes only the monthly income, keeping the rest of the profile
  async saveMonthlyIncome(monthlyIncome: number, now = new Date()) {
    const current = await profileRepo.get()
    await profileRepo.save({ name: current?.name, monthlyIncome }, now)
  },
}

// undefined while loading, null without a profile yet
export function useProfile(): Profile | null | undefined {
  return useLiveQuery(async () => (await profileRepo.get()) ?? null)
}
