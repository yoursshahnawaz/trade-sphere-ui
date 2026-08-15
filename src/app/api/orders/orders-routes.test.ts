// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/server/http', async (orig) => {
  const actual = await orig<typeof import('@/lib/server/http')>()
  return {
    ...actual,
    requireSession: vi.fn(async () => ({ sub: 'uid-order-test', email: 'x@x.com', role: 'buyer' as const })),
  }
})

import { POST } from './route'
import { GET } from './[id]/route'
import { requireSession } from '@/lib/server/http'
import { saveCart, getCart } from '@/lib/server/cart-store'
import { createOrder, listOrdersByUid } from '@/lib/server/order-store'
import type { NextRequest } from 'next/server'
import type { CartLine } from '@/types'

const line: CartLine = {
  productId: 'p1',
  title: 'Headphones',
  priceCents: 3000,
  imageUrl: 'https://example.com/i.webp',
  stock: 8,
  quantity: 1,
}
const address = {
  fullName: 'Ada Lovelace',
  line1: '12 MG Road',
  city: 'Bengaluru',
  region: 'Karnataka',
  postalCode: '560001',
  country: 'India',
}
const body = { shipping: address, billing: address, payment: { method: 'cod' } }

function post(b: unknown): NextRequest {
  return new Request('http://localhost/api/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(b),
  }) as unknown as NextRequest
}
const getReq = new Request('http://localhost/api/orders/x') as unknown as NextRequest

describe('orders routes', () => {
  it('creates an order from the server cart, computes totals, and clears the cart', async () => {
    saveCart('uid-order-test', [line])
    const res = await POST(post(body))
    expect(res.status).toBe(201)
    const { order } = (await res.json()) as { order: { id: string; totals: { subtotalCents: number; totalCents: number } } }
    expect(order.totals.subtotalCents).toBe(3000)
    expect(order.totals.totalCents).toBe(8440) // 3000 + 540 GST + 4900 shipping
    expect(getCart('uid-order-test')).toHaveLength(0)
  })

  it('rejects an empty cart', async () => {
    saveCart('uid-order-test', [])
    expect((await POST(post(body))).status).toBe(400)
  })

  it('GET enforces ownership (no IDOR)', async () => {
    saveCart('uid-order-test', [line])
    const { order } = (await (await POST(post(body))).json()) as { order: { id: string } }

    const owner = await GET(getReq, { params: Promise.resolve({ id: order.id }) })
    expect(owner.status).toBe(200)

    vi.mocked(requireSession).mockResolvedValueOnce({ sub: 'other-user', email: 'o@x.com', role: 'buyer' })
    const other = await GET(getReq, { params: Promise.resolve({ id: order.id }) })
    expect(other.status).toBe(404)
  })

  it('listOrdersByUid returns only that user\'s orders', () => {
    const totals = { subtotalCents: 3000, taxCents: 240, shippingCents: 500, totalCents: 3740 }
    createOrder({ uid: 'list-uid', items: [line], shipping: address, billing: address, payment: { method: 'cod' }, totals })
    createOrder({ uid: 'list-uid', items: [line], shipping: address, billing: address, payment: { method: 'cod' }, totals })
    const list = listOrdersByUid('list-uid')
    expect(list).toHaveLength(2)
    expect(list.every((o) => o.uid === 'list-uid')).toBe(true)
  })
})
