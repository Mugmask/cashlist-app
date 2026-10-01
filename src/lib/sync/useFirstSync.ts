import { useLiveQuery } from 'dexie-react-hooks'
import { useSyncExternalStore } from 'react'
import { db, SYNCED_ONCE_KEY } from '@/lib/db'
import { hasFinishedOnce, onFinishedOnce } from './sync'

// Whether this device already has the user's data: undefined while checking, false right
// after signing in on an empty device until the first sync finishes (well or not), true
// after. Screens show a skeleton meanwhile instead of filling in table by table.
export function useFirstSync() {
  const synced = useLiveQuery(async () => (await db.syncState.get(SYNCED_ONCE_KEY)) !== undefined)
  const finished = useSyncExternalStore(onFinishedOnce, hasFinishedOnce)
  if (synced === undefined) return undefined
  return synced || finished
}
