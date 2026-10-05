import { SHARE_CHIPS, shareOf, type ShareOption } from '@/features/expenses'
import type { FixedExpense } from '@/lib/db'
import { amountToInput } from '@/utils/currency'

type Shared = Pick<FixedExpense, 'shareWith' | 'sharePart'>

// My part of a month's bill of `total`, in the fixed expense's currency: an exact part stays
// the same whatever the bill comes to; an even split follows it
export function myPartOf(fixed: Shared, total: number) {
  if (fixed.sharePart !== undefined) return fixed.sharePart
  if (fixed.shareWith !== undefined) return shareOf(total, fixed.shareWith)
  return total
}

export function isShared(fixed: Shared) {
  return fixed.sharePart !== undefined || fixed.shareWith !== undefined
}

// "A medias", "Entre 3"; "Compartido" for an exact part; null when it's only mine
export function shareLabel(fixed: Shared) {
  if (fixed.shareWith !== undefined) {
    return SHARE_CHIPS.find((c) => c.value === String(fixed.shareWith))?.label ?? 'Compartido'
  }
  return fixed.sharePart !== undefined ? 'Compartido' : null
}

// The share chips and exact part as the form loads them
export function shareInput(fixed: Shared | undefined): { share: ShareOption; part: string } {
  if (fixed?.sharePart !== undefined) return { share: 'part', part: amountToInput(fixed.sharePart) }
  if (fixed?.shareWith !== undefined)
    return { share: String(fixed.shareWith) as ShareOption, part: '' }
  return { share: '1', part: '' }
}

// What the form's chips save: how many even parts, or my exact part (undefined clears either)
export function shareFields(share: ShareOption, part: number | null): Required<Shared> | Shared {
  if (share === '1') return { shareWith: undefined, sharePart: undefined }
  if (share === 'part') return { shareWith: undefined, sharePart: part ?? undefined }
  return { shareWith: Number(share), sharePart: undefined }
}
