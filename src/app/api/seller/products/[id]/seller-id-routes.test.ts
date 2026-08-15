// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/server/http', async (orig) => {
  const actual = await orig<typeof import('@/lib/server/http')>()
  return { ...actual, requireSession: vi.fn() }
})

import { GET, PATCH, DELETE } from './route'
import { requireSession } from '@/lib/server/http'
import { addSellerProduct, getSellerProduct } from '@/lib/server/seller-store'
import type { NextRequest } from 'next/server'

const uid = 'seller-id-test'
const asSeller = { sub: uid, email: 's@x.com', role: 'seller' as const }
const asBuyer = { sub: 'buyer-y', email: 'b@x.com', role: 'buyer' as const }

function req(method: string, body?: unknown): NextRequest {
  return new Request('http://localhost/api/seller/products/x', {
    method,
    headers: { 'content-type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  }) as unknown as NextRequest
}
const P = (id: string): { params: Promise<{ id: string }> } => ({ params: Promise.resolve({ id }) })

describe('seller product [id] routes', () => {
  it('PATCH updates an owned product (stock + offer)', async () => {
    vi.mocked(requireSession).mockResolvedValue(asSeller)
    const created = addSellerProduct(uid, { title: 'Editable', category: 'home', priceCents: 5000, stock: 2, status: 'active' })
    const res = await PATCH(req('PATCH', { stock: 15, salePriceCents: 4000 }), P(created.id))
    expect(res.status).toBe(200)
    expect(getSellerProduct(uid, created.id)?.stock).toBe(15)
    expect(getSellerProduct(uid, created.id)?.salePriceCents).toBe(4000)
  })

  it('PATCH rejects a sale price >= price', async () => {
    vi.mocked(requireSession).mockResolvedValue(asSeller)
    const created = addSellerProduct(uid, { title: 'NoDeal', category: 'home', priceCents: 5000, stock: 2, status: 'active' })
    expect((await PATCH(req('PATCH', { salePriceCents: 6000 }), P(created.id))).status).toBe(400)
  })

  it('PATCH 404 for a missing product', async () => {
    vi.mocked(requireSession).mockResolvedValue(asSeller)
    expect((await PATCH(req('PATCH', { stock: 1 }), P('does-not-exist'))).status).toBe(404)
  })

  it('DELETE removes an owned product', async () => {
    vi.mocked(requireSession).mockResolvedValue(asSeller)
    const created = addSellerProduct(uid, { title: 'Doomed', category: 'home', priceCents: 999, stock: 1, status: 'active' })
    expect((await DELETE(req('DELETE'), P(created.id))).status).toBe(200)
    expect(getSellerProduct(uid, created.id)).toBeUndefined()
  })

  it('GET is 403 for a buyer and 401 for anon', async () => {
    vi.mocked(requireSession).mockResolvedValueOnce(asBuyer)
    expect((await GET(req('GET'), P('x'))).status).toBe(403)
    vi.mocked(requireSession).mockResolvedValueOnce(null)
    expect((await GET(req('GET'), P('x'))).status).toBe(401)
  })
})
