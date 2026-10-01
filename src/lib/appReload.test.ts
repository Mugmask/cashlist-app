import { afterEach, describe, expect, it, vi } from 'vitest'
import { reloadApp } from './appReload'

// A browser with this app's service worker: a registration, maybe a new version waiting
function setUp(waiting: { postMessage: ReturnType<typeof vi.fn> } | null) {
  const listeners = new Map<string, () => void>()
  const reload = vi.fn()
  const registration = { update: vi.fn().mockResolvedValue(undefined), installing: null, waiting }
  vi.stubGlobal('window', { location: { reload } })
  vi.stubGlobal('navigator', {
    serviceWorker: {
      getRegistration: vi.fn().mockResolvedValue(registration),
      addEventListener: (type: string, fn: () => void) => listeners.set(type, fn),
    },
  })
  return { reload, registration, listeners }
}

afterEach(() => vi.unstubAllGlobals())

describe('reloadApp', () => {
  it('switches to a new version waiting, then reloads into it', async () => {
    const waiting = { postMessage: vi.fn() }
    const { reload, registration, listeners } = setUp(waiting)
    // The new version takes over as soon as it's told to
    waiting.postMessage.mockImplementation(() => listeners.get('controllerchange')?.())

    await reloadApp()

    expect(registration.update).toHaveBeenCalled()
    expect(waiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
    expect(reload).toHaveBeenCalledOnce()
  })

  it('without a new version, just reloads', async () => {
    const { reload } = setUp(null)

    await reloadApp()

    expect(reload).toHaveBeenCalledOnce()
  })
})
