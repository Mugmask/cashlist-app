import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { cardRepo } from './cardRepo'

beforeEach(async () => {
  await db.cardStatements.clear()
})

describe('cardRepo', () => {
  it('marks a statement as paid once per month, and can undo it', async () => {
    await cardRepo.markPaid('2026-09')
    await cardRepo.markPaid('2026-09') // same month again: still one row
    expect(await db.cardStatements.count()).toBe(1)
    expect(await db.cardStatements.get('2026-09')).toMatchObject({ deleted: false, pending: 1 })

    await cardRepo.unmarkPaid('2026-09')
    expect(await db.cardStatements.get('2026-09')).toMatchObject({ deleted: true, pending: 1 })

    await cardRepo.markPaid('2026-09') // and mark it again
    expect((await db.cardStatements.get('2026-09'))?.deleted).toBe(false)
  })
})
