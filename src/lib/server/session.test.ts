// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { createSessionJwt, verifySessionJwt } from './session'

describe('session jwt', () => {
  it('round-trips claims through sign + verify', async () => {
    const token = await createSessionJwt({ sub: 'uid-1', email: 'a@b.com', role: 'seller' })
    const claims = await verifySessionJwt(token)
    expect(claims).toMatchObject({ sub: 'uid-1', email: 'a@b.com', role: 'seller' })
  })

  it('rejects a tampered token', async () => {
    const token = await createSessionJwt({ sub: 'uid-1', role: 'buyer' })
    await expect(verifySessionJwt(token + 'x')).rejects.toThrow()
  })

  it('throws when the secret is too short', async () => {
    const original = process.env.SESSION_JWT_SECRET
    process.env.SESSION_JWT_SECRET = 'too-short'
    try {
      await expect(createSessionJwt({ sub: 'uid-1', role: 'buyer' })).rejects.toThrow(/32 bytes/)
    } finally {
      process.env.SESSION_JWT_SECRET = original
    }
  })
})
