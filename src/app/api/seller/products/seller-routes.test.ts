// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/server/http', async (orig) => {
  const actual = await orig<typeof import('@/lib/server/http')>()
  return { ...actual, requireSession: vi.fn() }
})
vi.mock('@/lib/server/seller-store', () => ({
  listSellerProducts: vi.fn(async () => [
    { id: 'x', sellerUid: 'seller-route-test', title: 'Thing', category: 'home', priceCents: 100000, stock: 1, imageUrl: 'https://picsum.photos/seed/x/600/600', status: 'active' },
  ]),
  addSellerProduct: vi.fn(async (_uid: string, input: Record<string, unknown>) => ({
    ...input,
    id: 'new',
    sellerUid: 'seller-route-test',
    imageUrl: (input.imageUrl as string) ?? 'https://picsum.photos/seed/new/600/600',
  })),
}))

import { GET, POST } from './route'
import { requireSession } from '@/lib/server/http'
import type { NextRequest } from 'next/server'

const asSeller = { sub: 'seller-route-test', email: 's@x.com', role: 'seller' as const }
const asBuyer = { sub: 'buyer-x', email: 'b@x.com', role: 'buyer' as const }

function post(b: unknown): NextRequest {
  return new Request('http://localhost/api/seller/products', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(b),
  }) as unknown as NextRequest
}

describe('seller products routes', () => {
  it('GET returns 401 when unauthenticated', async () => {
    vi.mocked(requireSession).mockResolvedValueOnce(null)
    expect((await GET()).status).toBe(401)
  })

  it('GET returns 403 for a buyer', async () => {
    vi.mocked(requireSession).mockResolvedValueOnce(asBuyer)
    expect((await GET()).status).toBe(403)
  })

  it('GET returns the seller products', async () => {
    vi.mocked(requireSession).mockResolvedValueOnce(asSeller)
    const res = await GET()
    expect(res.status).toBe(200)
    const { products } = (await res.json()) as { products: unknown[] }
    expect(products.length).toBeGreaterThan(0)
  })

  it('POST adds a product and defaults imageUrl + status', async () => {
    vi.mocked(requireSession).mockResolvedValueOnce(asSeller)
    const res = await POST(post({ title: 'CLI Widget', category: 'home', priceCents: 2599, stock: 4 }))
    expect(res.status).toBe(201)
    const { product } = (await res.json()) as { product: { imageUrl: string; status: string } }
    expect(product.imageUrl).toMatch(/picsum\.photos/)
    expect(product.status).toBe('active')
  })

  it('POST rejects an invalid body (non-positive price)', async () => {
    vi.mocked(requireSession).mockResolvedValueOnce(asSeller)
    expect((await POST(post({ title: 'Widget', category: 'home', priceCents: -5, stock: 4 }))).status).toBe(400)
  })
})
