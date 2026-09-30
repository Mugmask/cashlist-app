// Checking an item moves it to the other list, so React unmounts the focused button. The id
// is parked here (shared by both lists) and whichever list renders it next takes focus back.
let pendingId: string | null = null

export function requestRefocus(id: string) {
  pendingId = id
}

// True (and consumed) if `id` is waiting to get focus back
export function takeRefocus(id: string) {
  if (pendingId !== id) return false
  pendingId = null
  return true
}

export function pendingRefocus() {
  return pendingId
}
