import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Profile } from '@/lib/db'

const ID = 'me' // a single row per user

export interface ProfileFields {
  name?: string
  monthlyIncome?: number // pesos
}

export const profileRepo = {
  // Replaces the whole profile: a field left out is cleared
  async save(fields: ProfileFields, now = new Date()) {
    await db.profile.put({
      ...fields,
      id: ID,
      updatedAt: now.toISOString(),
      deleted: false,
      pending: 1,
    })
  },

  get() {
    return db.profile.get(ID)
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
