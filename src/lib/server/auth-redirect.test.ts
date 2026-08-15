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

  it('allows guests and buyers to browse the storefront', () => {
    expect(decideAuth('/', '', null)).toEqual({ type: 'next' })
    expect(decideAuth('/products/p1', '', { role: 'buyer' })).toEqual({ type: 'next' })
  })

  it('redirects a seller away from buyer shopping routes to their portal', () => {
    expect(decideAuth('/', '', { role: 'seller' })).toEqual({ type: 'redirect', to: '/seller' })
    expect(decideAuth('/products/p1', '', { role: 'seller' })).toEqual({ type: 'redirect', to: '/seller' })
    expect(decideAuth('/checkout', '', { role: 'seller' })).toEqual({ type: 'redirect', to: '/seller' })
    expect(decideAuth('/orders', '', { role: 'seller' })).toEqual({ type: 'redirect', to: '/seller' })
  })
})
