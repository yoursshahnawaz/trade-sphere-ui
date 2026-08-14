// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/server/http', async (orig) => {
  const actual = await orig<typeof import('@/lib/server/http')>()
  return {
    ...actual,
    requireSession: vi.fn(async () => ({ sub: 'uid-cart-route', email: 'x@x.com', role: 'buyer' as const })),
  }
})

import { PUT } from './route'
import { POST as mergePost } from './merge/route'
import type { NextRequest } from 'next/server'
import type { CartLine } from '@/types'

function req(url: string, method: string, body: unknown): NextRequest {
  return new Request(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest
}

describe('cart routes', () => {
  it('PUT re-derives price from seed and clamps to stock', async () => {
    const res = await PUT(req('http://localhost/api/cart', 'PUT', { items: [{ productId: 'p1', quantity: 2 }] }))
    expect(res.status).toBe(200)
    const { items } = (await res.json()) as { items: CartLine[] }
    expect(items[0]?.productId).toBe('p1')
    expect(items[0]?.priceCents).toBe(12999)
    expect(items[0]?.quantity).toBe(2)
  })

  it('merge sums with the existing server cart', async () => {
    await PUT(req('http://localhost/api/cart', 'PUT', { items: [{ productId: 'p1', quantity: 2 }] }))
    const res = await mergePost(req('http://localhost/api/cart/merge', 'POST', { items: [{ productId: 'p1', quantity: 3 }] }))
    const { items } = (await res.json()) as { items: CartLine[] }
    expect(items.find((i) => i.productId === 'p1')?.quantity).toBe(5)
  })
})
