import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from '@/mocks/server'

// jsdom doesn't implement matchMedia; components reading prefers-reduced-motion need it.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

// jsdom lacks these observers; carousels/tables/charts construct them on mount.
class NoopObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): [] {
    return []
  }
}
if (typeof globalThis !== 'undefined') {
  globalThis.IntersectionObserver ??= NoopObserver as unknown as typeof IntersectionObserver
  globalThis.ResizeObserver ??= NoopObserver as unknown as typeof ResizeObserver
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterEach(() => {
  cleanup()
  server.resetHandlers()
})

afterAll(() => server.close())
