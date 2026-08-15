import { describe, it, expect } from 'vitest'
import { checkoutReducer, initialCheckoutState, type CheckoutState } from './checkout-state'
import type { Address } from '@/lib/schemas/address-schema'
import type { PaymentStored } from '@/lib/schemas/payment-schema'

const addr: Address = {
  fullName: 'Ada Lovelace',
  line1: '12 Analytical Ave',
  city: 'London',
  region: 'Greater London',
  postalCode: 'EC1',
  country: 'United Kingdom',
}
const payment: PaymentStored = { method: 'cod' }

describe('checkoutReducer', () => {
  it('starts at the cart step', () => {
    expect(initialCheckoutState.step).toBe('cart')
  })

  it('only advances by committing each step (no skipping to review)', () => {
    let s = checkoutReducer(initialCheckoutState, { type: 'cartContinue' })
    expect(s.step).toBe('shipping')
    s = checkoutReducer(s, { type: 'saveShipping', shipping: addr })
    expect(s.step).toBe('billing')
    expect(s.shipping).toEqual(addr)
    s = checkoutReducer(s, { type: 'saveBilling', billing: addr, sameBilling: true, payment })
    expect(s.step).toBe('review')
    expect(s.billing).toEqual(addr)
    expect(s.payment).toEqual(payment)
  })

  it('back moves toward cart and never below it', () => {
    const atReview: CheckoutState = { step: 'review', shipping: addr, billing: addr, sameBilling: true, payment }
    expect(checkoutReducer(atReview, { type: 'back' }).step).toBe('billing')
    expect(checkoutReducer(initialCheckoutState, { type: 'back' }).step).toBe('cart')
  })
})
