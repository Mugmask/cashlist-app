import { createContext, use, useEffect, useRef } from 'react'

// What the app's main button (the bottom nav's +) does on the current screen
export interface PrimaryAction {
  label: string // accessible name of the button: "Agregar gasto fijo"
  run: () => void
}

export interface PrimaryActionStore {
  action: PrimaryAction | null
  setAction: (update: (current: PrimaryAction | null) => PrimaryAction | null) => void
}

export const PrimaryActionContext = createContext<PrimaryActionStore | null>(null)

function useStore() {
  const store = use(PrimaryActionContext)
  if (!store) throw new Error('usePrimaryAction must be used inside <PrimaryActionProvider>')
  return store
}

// A screen claims the main button while it's mounted; on leaving it goes back to the default.
// `run` may change every render: the button always calls the latest one.
export function usePrimaryAction(label: string, run: () => void) {
  const { setAction } = useStore()
  const runRef = useRef(run)

  useEffect(() => {
    runRef.current = run
  })

  useEffect(() => {
    const action: PrimaryAction = { label, run: () => runRef.current() }
    setAction(() => action)
    // Only clear our own: the next screen may have claimed it already
    return () => setAction((current) => (current === action ? null : current))
  }, [label, setAction])
}

// The action the current screen claimed, or null to use the button's default
export function useCurrentPrimaryAction() {
  return useStore().action
}
