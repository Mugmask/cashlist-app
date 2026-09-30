import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { convertAmount, getDollarRate, rateKindFor, toPesos } from './exchangeRates'

const ok = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))

// Tests run in node, which has no localStorage: an in-memory one per test
function memoryStorage() {
  const items = new Map<string, string>()
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  }
}

beforeEach(() => vi.stubGlobal('localStorage', memoryStorage()))
afterEach(() => vi.unstubAllGlobals())

describe('getDollarRate', () => {
  it('reads the selling price', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => ok({ venta: 1560, fechaActualizacion: '2026-09-30T20:59:00.000Z' })),
    )
    expect(await getDollarRate('blue')).toEqual({
      kind: 'blue',
      rate: 1560,
      at: '2026-09-30T20:59:00.000Z',
    })
  })

  it('falls back to the last rate fetched when offline', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => ok({ venta: 1425, fechaActualizacion: '2026-09-29T12:00:00.000Z' })),
    )
    await getDollarRate('tarjeta')
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    )
    expect((await getDollarRate('tarjeta'))?.rate).toBe(1425)
  })

  it('is null offline with nothing cached, and ignores a bad answer', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => ok({ venta: 'n/a' })),
    )
    expect(await getDollarRate('blue')).toBeNull()
  })
})

describe('rateKindFor / toPesos', () => {
  it('uses the card dollar for card purchases and blue for cash', () => {
    expect(rateKindFor('card')).toBe('tarjeta')
    expect(rateKindFor('cash')).toBe('blue')
  })

  it('rounds to cents', () => {
    expect(toPesos(10.99, 1560.5)).toBe(17149.9)
    expect(toPesos(0.01, 1234.567)).toBe(12.35)
  })
})

describe('convertAmount', () => {
  it('converts both ways at the given rate', async () => {
    expect(await convertAmount(13, 'ARS', 'card', 2002)).toBe(26026)
    expect(await convertAmount(450000, 'USD', 'cash', 2002)).toBe(224.78)
  })

  it("uses today's rate for how it's paid when none is given", async () => {
    const fetch = vi.fn((url: string) => ok({ venta: url.endsWith('/tarjeta') ? 2000 : 1500 }))
    vi.stubGlobal('fetch', fetch)
    expect(await convertAmount(10, 'ARS', 'card')).toBe(20000)
    expect(await convertAmount(10, 'ARS', 'cash')).toBe(15000)
  })

  it('is null without any rate', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    )
    expect(await convertAmount(10, 'ARS', 'cash')).toBeNull()
  })
})
