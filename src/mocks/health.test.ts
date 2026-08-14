import { describe, it, expect } from 'vitest'

describe('msw health handler', () => {
  it('intercepts GET /api/health and returns ok', async () => {
    // Relative URL — the handler is registered origin-agnostically as /api/health.
    const res = await fetch('/api/health')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { status: string }
    expect(body.status).toBe('ok')
  })
})
