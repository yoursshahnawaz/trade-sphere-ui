// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/headers', () => ({
  cookies: async () => ({ set: vi.fn(), delete: vi.fn(), get: vi.fn() }),
}))
vi.mock('@/lib/server/firebase-verify', () => ({
  // The token string doubles as the uid so each test uses a distinct user.
  verifyFirebaseIdToken: vi.fn(async (token: string) => ({ sub: token, email: `${token}@x.com` })),
}))

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
})
