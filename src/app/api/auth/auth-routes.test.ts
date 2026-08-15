// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/headers', () => ({
  cookies: async () => ({ set: vi.fn(), delete: vi.fn(), get: vi.fn() }),
}))
vi.mock('@/lib/server/firebase-verify', () => ({
  // The token string doubles as the uid so each test uses a distinct user.
  verifyFirebaseIdToken: vi.fn(async (token: string) => ({ sub: token, email: `${token}@x.com` })),
}))
// DB-backed stores stubbed with an in-memory impl that preserves the role-merge
// rule (existing role is never upgraded) so the route contract is what's tested.
vi.mock('@/lib/server/user-store', () => {
  const users = new Map<string, { uid: string; email?: string; role: string; storeName?: string }>()
  return {
    upsertUser: vi.fn(async (input: { uid: string; email?: string; role?: string; storeName?: string }) => {
      const existing = users.get(input.uid)
      if (existing) return existing
      const created = { uid: input.uid, email: input.email, role: input.role ?? 'buyer', storeName: input.storeName }
      users.set(input.uid, created)
      return created
    }),
    getUser: vi.fn(async (uid: string) => users.get(uid)),
  }
})
vi.mock('@/lib/server/sellers', () => ({ setSellerInfo: vi.fn(async () => {}) }))

import { POST as sessionPost } from './session/route'
import { POST as sellerPost } from './seller-register/route'
import type { NextRequest } from 'next/server'

function post(url: string, body: unknown): NextRequest {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest
}

describe('auth routes — role integrity', () => {
  it('session POST ignores a body role and defaults a new user to buyer', async () => {
    const res = await sessionPost(
      post('http://localhost/api/auth/session', { idToken: 'uid-escalate', role: 'seller' }),
    )
    expect(res.status).toBe(200)
    const json = (await res.json()) as { user: { role: string } }
    expect(json.user.role).toBe('buyer')
  })

  it('seller-register POST grants seller for a new user', async () => {
    const res = await sellerPost(
      post('http://localhost/api/auth/seller-register', { idToken: 'uid-seller', storeName: 'My Store' }),
    )
    expect(res.status).toBe(200)
    const json = (await res.json()) as { user: { role: string } }
    expect(json.user.role).toBe('seller')
  })

  it('seller-register rejects a missing storeName', async () => {
    const res = await sellerPost(
      post('http://localhost/api/auth/seller-register', { idToken: 'uid-nostore' }),
    )
    expect(res.status).toBe(400)
  })

  it('a seller who logs back in via /session keeps the seller role', async () => {
    // Register as a seller...
    await sellerPost(
      post('http://localhost/api/auth/seller-register', { idToken: 'uid-returning', storeName: 'My Store' }),
    )
    // ...then log in again through the normal session endpoint (no role in body).
    const res = await sessionPost(post('http://localhost/api/auth/session', { idToken: 'uid-returning' }))
    expect(res.status).toBe(200)
    const json = (await res.json()) as { user: { role: string } }
    expect(json.user.role).toBe('seller')
  })
})
