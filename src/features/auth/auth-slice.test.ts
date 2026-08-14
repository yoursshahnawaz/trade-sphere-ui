import { describe, it, expect } from 'vitest'
import reducer, { setLoading, setUser, clearUser } from './auth-slice'

describe('authSlice', () => {
  it('starts idle with no user', () => {
    const s = reducer(undefined, { type: '@@INIT' })
    expect(s.status).toBe('idle')
    expect(s.user).toBeNull()
  })

  it('setUser authenticates', () => {
    const s = reducer(undefined, setUser({ uid: 'u1', email: 'a@b.com', role: 'buyer' }))
    expect(s.status).toBe('authenticated')
    expect(s.user?.uid).toBe('u1')
  })

  it('clearUser unauthenticates', () => {
    const s = reducer({ status: 'authenticated', user: { uid: 'u1', role: 'seller' } }, clearUser())
    expect(s.status).toBe('unauthenticated')
    expect(s.user).toBeNull()
  })

  it('setLoading marks loading', () => {
    expect(reducer(undefined, setLoading()).status).toBe('loading')
  })
})
