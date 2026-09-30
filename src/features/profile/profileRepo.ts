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
}

// undefined while loading, null without a profile yet
export function useProfile(): Profile | null | undefined {
  return useLiveQuery(async () => (await profileRepo.get()) ?? null)
}
