import { useLiveQuery } from 'dexie-react-hooks'

// useLiveQuery for data that depends on a key (a month, say). useLiveQuery keeps returning
// the previous key's result until the new one arrives; this returns undefined (loading)
// instead, so a screen never shows one month's numbers next to another's.
export function useKeyedLiveQuery<T>(querier: () => Promise<T>, key: string | number) {
  const tagged = useLiveQuery(async () => ({ key, value: await querier() }), [key])
  return tagged?.key === key ? tagged.value : undefined
}
