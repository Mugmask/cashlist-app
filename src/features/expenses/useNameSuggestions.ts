import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { buildSuggestions } from './suggestions'

// The names already used, kept up to date; empty while loading (the form works without them)
export function useNameSuggestions() {
  return (
    useLiveQuery(async () =>
      buildSuggestions(await db.expenses.filter((e) => !e.deleted && !!e.name).toArray()),
    ) ?? []
  )
}
