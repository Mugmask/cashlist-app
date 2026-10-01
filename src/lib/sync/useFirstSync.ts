import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { db, OWNER_KEY, SYNCED_ONCE_KEY } from '@/lib/db'
import { finishedForUser, onFinished } from './sync'

// Past this, the screens show whatever there is: a network that hangs without failing (a
// captive portal) would otherwise keep the skeleton up for minutes
const MAX_WAIT_MS = 12_000

// Whether this device has `userId`'s data: undefined while checking, false right after
// signing in on a device without it until their first sync finishes (well or not), true
// after. Screens show a skeleton meanwhile instead of filling in table by table.
export function useFirstSync(userId: string) {
  const synced = useLiveQuery(async () => {
    const [flag, owner] = await Promise.all([
      db.syncState.get(SYNCED_ONCE_KEY),
      db.syncState.get(OWNER_KEY),
    ])
    return flag !== undefined && owner?.value === userId
  }, [userId])
  const finished = useSyncExternalStore(onFinished, finishedForUser) === userId
  const [waitedEnough, setWaitedEnough] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setWaitedEnough(true), MAX_WAIT_MS)
    return () => clearTimeout(timer)
  }, [userId])

  if (synced === undefined) return undefined
  return synced || finished || waitedEnough
}
