import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="update-prompt" role="status">
      <span>Hay una versión nueva.</span>
      <button onClick={() => updateServiceWorker(true)}>Actualizar</button>
      <button className="secondary" onClick={() => setNeedRefresh(false)}>
        Después
      </button>
    </div>
  )
}
