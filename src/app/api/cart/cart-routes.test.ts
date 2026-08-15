// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/server/http', async (orig) => {
  const actual = await orig<typeof import('@/lib/server/http')>()
  return { ...actual, requireSession: vi.fn() }
})
vi.mock('@/lib/server/cart-store', () => ({
  getCart: vi.fn(() => []),
  saveCart: vi.fn((_uid: string, lines: unknown) => lines),
  // Server re-derives lines from the catalog; stubbed here so the route test is DB-free.
  normalizeInputs: vi.fn(async () => [
    { productId: 'p1', title: 'X', priceCents: 249900, imageUrl: 'https://e.com/i.webp', stock: 8, quantity: 2 },
  ]),
}))

import { GET, PUT } from './route'
import { requireSession } from '@/lib/server/http'
import type { NextRequest } from 'next/server'

const asBuyer = { sub: 'u1', email: 'b@x.com', role: 'buyer' as const }
function put(b: unknown): NextRequest {
  return new Request('http://localhost/api/cart', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(b),
  }) as unknown as NextRequest
}

describe('cart routes', () => {
  it('GET is 401 without a session', async () => {
    vi.mocked(requireSession).mockResolvedValueOnce(null)
    expect((await GET()).status).toBe(401)
  })

  it('PUT returns server-derived lines (client-untrusted price)', async () => {
    vi.mocked(requireSession).mockResolvedValueOnce(asBuyer)
    const res = await PUT(put({ items: [{ productId: 'p1', quantity: 2 }] }))
    expect(res.status).toBe(200)
    const { items } = (await res.json()) as { items: { productId: string; priceCents: number }[] }
    expect(items[0]?.productId).toBe('p1')
    expect(items[0]?.priceCents).toBe(249900)
  })
})
