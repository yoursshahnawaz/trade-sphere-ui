import { describe, it, expect } from 'vitest'
import { decideAuth } from './auth-redirect'

describe('decideAuth', () => {
  it('allows /seller/register without a session', () => {
    expect(decideAuth('/seller/register', '', null)).toEqual({ type: 'next' })
  })

  it('redirects unauthenticated users to login with an encoded returnUrl', () => {
    expect(decideAuth('/checkout', '?step=1', null)).toEqual({
      type: 'redirect',
      to: '/login?returnUrl=%2Fcheckout%3Fstep%3D1',
    })
  })

  it('redirects a buyer away from /seller to home', () => {
    expect(decideAuth('/seller', '', { role: 'buyer' })).toEqual({ type: 'redirect', to: '/' })
  })

  it('allows a seller into /seller', () => {
    expect(decideAuth('/seller/dashboard', '', { role: 'seller' })).toEqual({ type: 'next' })
  })

  it('allows an authenticated buyer into /checkout', () => {
    expect(decideAuth('/checkout', '', { role: 'buyer' })).toEqual({ type: 'next' })
  })
})
