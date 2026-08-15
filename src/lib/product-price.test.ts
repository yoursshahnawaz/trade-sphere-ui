import { describe, it, expect } from 'vitest'
import { effectivePriceCents } from './product-price'

describe('effectivePriceCents', () => {
  it('returns the list price when there is no sale', () => {
    expect(effectivePriceCents({ priceCents: 5000 })).toBe(5000)
  })

  it('returns the sale price when it is a valid discount', () => {
    expect(effectivePriceCents({ priceCents: 5000, salePriceCents: 3999 })).toBe(3999)
  })

  it('ignores a sale price that is not below the list price', () => {
    expect(effectivePriceCents({ priceCents: 5000, salePriceCents: 5000 })).toBe(5000)
    expect(effectivePriceCents({ priceCents: 5000, salePriceCents: 6000 })).toBe(5000)
  })
})
