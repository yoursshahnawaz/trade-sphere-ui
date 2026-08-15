import { describe, it, expect } from 'vitest'
import { computeTotals } from './order-totals'

describe('computeTotals', () => {
  it('zero subtotal → all zero', () => {
    expect(computeTotals(0)).toEqual({ subtotalCents: 0, taxCents: 0, shippingCents: 0, totalCents: 0 })
  })

  it('below free-shipping threshold charges flat shipping', () => {
    // 3000 → tax round(240)=240, shipping 500 → total 3740
    expect(computeTotals(3000)).toEqual({
      subtotalCents: 3000,
      taxCents: 240,
      shippingCents: 500,
      totalCents: 3740,
    })
  })

  it('at/above threshold is free shipping', () => {
    expect(computeTotals(5000)).toEqual({
      subtotalCents: 5000,
      taxCents: 400,
      shippingCents: 0,
      totalCents: 5400,
    })
  })

  it('rounds tax to the nearest cent', () => {
    // 1299 * 0.08 = 103.92 → 104
    expect(computeTotals(1299).taxCents).toBe(104)
  })
})
