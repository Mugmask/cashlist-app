import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { profileRepo } from './profileRepo'

beforeEach(async () => {
  await db.profile.clear()
})

describe('profileRepo', () => {
  it('save stores the single profile as pending upload', async () => {
    const now = new Date('2026-09-30T12:00:00Z')
    await profileRepo.save({ name: 'Fran', monthlyIncome: 1_200_000 }, now)

    expect(await profileRepo.get()).toEqual({
      id: 'me',
      name: 'Fran',
      monthlyIncome: 1_200_000,
      updatedAt: now.toISOString(),
      deleted: false,
      pending: 1,
    })
  })

  it('save replaces it: a field left out is cleared', async () => {
    await profileRepo.save({ name: 'Fran', monthlyIncome: 1_200_000 })
    await profileRepo.save({ name: 'Fran' })

    expect(await db.profile.count()).toBe(1)
    expect((await profileRepo.get())?.monthlyIncome).toBeUndefined()
  })
})
