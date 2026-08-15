// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/server/http', async (orig) => {
  const actual = await orig<typeof import('@/lib/server/http')>()
  return { ...actual, requireSession: vi.fn() }
})
vi.mock('@/lib/server/seller-store', () => ({
  getSellerProduct: vi.fn(),
  updateSellerProduct: vi.fn(async (_u: string, _id: string, patch: Record<string, unknown>) => ({
    id: 'x',
    sellerUid: 'seller-id-test',
    title: 'T',
    category: 'home',
    priceCents: 5000,
    stock: 2,
    imageUrl: 'https://picsum.photos/seed/x/600/600',
    status: 'active',
    ...patch,
  })),
  removeSellerProduct: vi.fn(async () => true),
}))

import { GET, PATCH, DELETE } from './route'
import { requireSession } from '@/lib/server/http'
import { getSellerProduct } from '@/lib/server/seller-store'
import type { NextRequest } from 'next/server'

const uid = 'seller-id-test'
const asSeller = { sub: uid, email: 's@x.com', role: 'seller' as const }
const asBuyer = { sub: 'buyer-y', email: 'b@x.com', role: 'buyer' as const }
const existing = {
  id: 'x',
  sellerUid: uid,
  title: 'T',
  category: 'home',
  priceCents: 5000,
  stock: 2,
  imageUrl: 'https://picsum.photos/seed/x/600/600',
  status: 'active' as const,
}

function req(method: string, body?: unknown): NextRequest {
  return new Request('http://localhost/api/seller/products/x', {
    method,
    headers: { 'content-type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  }) as unknown as NextRequest
}
const P = (id: string): { params: Promise<{ id: string }> } => ({ params: Promise.resolve({ id }) })

describe('seller product [id] routes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('PATCH updates an owned product (stock + offer)', async () => {
    vi.mocked(requireSession).mockResolvedValue(asSeller)
    vi.mocked(getSellerProduct).mockResolvedValue(existing)
    const res = await PATCH(req('PATCH', { stock: 15, salePriceCents: 4000 }), P('x'))
    expect(res.status).toBe(200)
    const { product } = (await res.json()) as { product: { stock: number; salePriceCents: number } }
    expect(product.stock).toBe(15)
    expect(product.salePriceCents).toBe(4000)
  })

  it('PATCH rejects a sale price >= price', async () => {
    vi.mocked(requireSession).mockResolvedValue(asSeller)
    vi.mocked(getSellerProduct).mockResolvedValue(existing)
    expect((await PATCH(req('PATCH', { salePriceCents: 6000 }), P('x'))).status).toBe(400)
  })

  it('PATCH 404 for a missing product', async () => {
    vi.mocked(requireSession).mockResolvedValue(asSeller)
    vi.mocked(getSellerProduct).mockResolvedValue(undefined)
    expect((await PATCH(req('PATCH', { stock: 1 }), P('missing'))).status).toBe(404)
  })

  it('DELETE removes an owned product', async () => {
    vi.mocked(requireSession).mockResolvedValue(asSeller)
    expect((await DELETE(req('DELETE'), P('x'))).status).toBe(200)
  })

  it('GET is 403 for a buyer and 401 for anon', async () => {
    vi.mocked(requireSession).mockResolvedValueOnce(asBuyer)
    expect((await GET(req('GET'), P('x'))).status).toBe(403)
    vi.mocked(requireSession).mockResolvedValueOnce(null)
    expect((await GET(req('GET'), P('x'))).status).toBe(401)
  })
})
