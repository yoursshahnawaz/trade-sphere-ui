import { describe, it, expect } from 'vitest'
import { computeTotals } from './order-totals'

describe('computeTotals', () => {
  it('zero subtotal → all zero', () => {
    expect(computeTotals(0)).toEqual({ subtotalCents: 0, taxCents: 0, shippingCents: 0, totalCents: 0 })
  })

  it('below free-shipping threshold charges flat shipping', () => {
    // 3000 → GST round(540)=540, shipping 4900 → total 8440
    expect(computeTotals(3000)).toEqual({
      subtotalCents: 3000,
      taxCents: 540,
      shippingCents: 4900,
      totalCents: 8440,
    })
  })

  it('at/above ₹500 is free shipping', () => {
    expect(computeTotals(50000)).toEqual({
      subtotalCents: 50000,
      taxCents: 9000,
      shippingCents: 0,
      totalCents: 59000,
    })
  })

  it('rounds GST to the nearest paisa', () => {
    // 1299 * 0.18 = 233.82 → 234
    expect(computeTotals(1299).taxCents).toBe(234)
  })
})
