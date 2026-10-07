import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { cardsRepo } from './cardsRepo'
import { buildSchedules } from './cycles'

// The user's cards and where each day falls in their statements; undefined while loading
export function useCards() {
  const data = useLiveQuery(async () => ({
    ...(await cardsRepo.all()),
    lastUsed: await cardsRepo.lastUsed(),
  }))
  return useMemo(() => {
    if (!data) return undefined
    const live = data.cards.filter((c) => !c.deleted)
    return {
      cards: data.cards,
      // The one a new card purchase starts on: the last one used, while it's still there
      preferred: live.some((c) => c.id === data.lastUsed) ? data.lastUsed : undefined,
      live: live.sort((a, b) => a.name.localeCompare(b.name, 'es')),
      schedules: buildSchedules(data.cycles),
    }
  }, [data])
}
