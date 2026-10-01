// Reloading the installed app. A new version the browser already downloaded waits until
// every tab of the app closes, which an installed app hardly ever does, and a plain reload
// keeps running the old one. So this looks for a new version first and, if there is one,
// switches to it; else it's a plain reload.

const CHECK_TIMEOUT_MS = 4000 // looking for a new version, on a slow network
const SWITCH_TIMEOUT_MS = 3000 // the new version taking over before reloading anyway

function within<T>(promise: Promise<T>, ms: number) {
  return Promise.race([promise, new Promise<undefined>((resolve) => setTimeout(resolve, ms))])
}

// Resolves once `worker` is installed (or stops trying), so it can take over
function installed(worker: ServiceWorker) {
  return new Promise<void>((resolve) => {
    if (worker.state !== 'installing') return resolve()
    worker.addEventListener('statechange', () => worker.state !== 'installing' && resolve())
  })
}

export async function reloadApp() {
  const registration = await navigator.serviceWorker?.getRegistration()
  if (registration) {
    await within(
      registration.update().catch(() => {}),
      CHECK_TIMEOUT_MS,
    )
    if (registration.installing) await within(installed(registration.installing), CHECK_TIMEOUT_MS)
    const waiting = registration.waiting
    if (waiting) {
      // The new version takes over, and the page reloads into it
      await within(
        new Promise<void>((resolve) => {
          navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), {
            once: true,
          })
          waiting.postMessage({ type: 'SKIP_WAITING' })
        }),
        SWITCH_TIMEOUT_MS,
      )
    }
  }
  window.location.reload()
}
