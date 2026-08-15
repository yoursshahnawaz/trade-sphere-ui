// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Product } from '@/types'

vi.mock('@/lib/server/http', async (orig) => {
  const actual = await orig<typeof import('@/lib/server/http')>()
  return { ...actual, requireSession: vi.fn() }
})
vi.mock('@/lib/server/product-store', () => ({ getProduct: vi.fn() }))
vi.mock('@/lib/server/user-profile', () => ({ getProfile: vi.fn(async () => null) }))
vi.mock('@/lib/server/review-store', () => ({
  addReview: vi.fn(async (productId: string, uid: string, authorName: string, input: { rating: number; body: string }) => ({
    id: 'rev-1',
    productId,
    authorName,
    rating: input.rating,
    body: input.body,
    createdAt: '2026-01-01T00:00:00.000Z',
  })),
}))

import { POST } from './route'
import { requireSession } from '@/lib/server/http'
import { getProduct } from '@/lib/server/product-store'
import { getProfile } from '@/lib/server/user-profile'
import { addReview } from '@/lib/server/review-store'
import type { NextRequest } from 'next/server'

const buyer = { sub: 'u1', email: 'ada@x.com', role: 'buyer' as const }
const product = { id: 'p1', title: 'X', priceCents: 1000, stock: 5, category: 'audio', imageUrl: 'https://e.com/i.webp' } as Product

function post(body: unknown): NextRequest {
  return new Request('http://localhost/api/products/p1/reviews', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest
}
const params = Promise.resolve({ id: 'p1' })

beforeEach(() => {
  vi.mocked(getProduct).mockResolvedValue(product)
})

describe('reviews POST', () => {
  it('401 without a session', async () => {
    vi.mocked(requireSession).mockResolvedValueOnce(null)
    expect((await POST(post({ rating: 5, body: '' }), { params })).status).toBe(401)
  })

  it('403 for a seller', async () => {
    vi.mocked(requireSession).mockResolvedValueOnce({ sub: 's1', email: 's@x.com', role: 'seller' })
    expect((await POST(post({ rating: 5, body: '' }), { params })).status).toBe(403)
  })

  it('404 when the product does not exist', async () => {
    vi.mocked(requireSession).mockResolvedValueOnce(buyer)
    vi.mocked(getProduct).mockResolvedValueOnce(undefined)
    expect((await POST(post({ rating: 5, body: '' }), { params })).status).toBe(404)
  })

  it('400 on an out-of-range rating', async () => {
    vi.mocked(requireSession).mockResolvedValueOnce(buyer)
    expect((await POST(post({ rating: 6, body: '' }), { params })).status).toBe(400)
  })

  it('201 creates a review with a neutral byline when no profile name is set', async () => {
    vi.mocked(requireSession).mockResolvedValueOnce(buyer)
    const res = await POST(post({ rating: 4, body: 'Great' }), { params })
    expect(res.status).toBe(201)
    const { review } = (await res.json()) as { review: { authorName: string; rating: number } }
    expect(review.rating).toBe(4)
    // No profile name (getProfile mocked to null) → never derive from the login email.
    expect(review.authorName).toBe('A shopper')
    expect(addReview).toHaveBeenCalledWith('p1', 'u1', 'A shopper', { rating: 4, body: 'Great' })
  })

  it('uses the profile name as the byline when set', async () => {
    vi.mocked(requireSession).mockResolvedValueOnce(buyer)
    vi.mocked(getProfile).mockResolvedValueOnce({ name: 'Ada Lovelace', gender: 'female', contact: '' })
    const res = await POST(post({ rating: 5, body: '' }), { params })
    expect(res.status).toBe(201)
    expect(addReview).toHaveBeenCalledWith('p1', 'u1', 'Ada Lovelace', { rating: 5, body: '' })
  })
})
