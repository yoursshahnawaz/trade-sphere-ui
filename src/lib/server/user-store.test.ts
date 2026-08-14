// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { upsertUser, getUser } from './user-store'

describe('user-store', () => {
  it('creates a new user defaulting to buyer', () => {
    const u = upsertUser({ uid: 'u-buyer', email: 'b@x.com' })
    expect(u.role).toBe('buyer')
    expect(getUser('u-buyer')?.role).toBe('buyer')
  })

  it('creates a seller when role is provided', () => {
    const u = upsertUser({ uid: 'u-seller', role: 'seller', storeName: 'Shop' })
    expect(u.role).toBe('seller')
    expect(u.storeName).toBe('Shop')
  })

  it('keeps the original role on repeat upsert (no escalation)', () => {
    upsertUser({ uid: 'u-keep', role: 'buyer' })
    const again = upsertUser({ uid: 'u-keep', role: 'seller', storeName: 'Sneaky' })
    expect(again.role).toBe('buyer')
    expect(again.storeName).toBeUndefined()
  })

  it('returns undefined for an unknown uid', () => {
    expect(getUser('nope')).toBeUndefined()
  })
})
