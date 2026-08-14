// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { normalizeInputs, saveCart, getCart, mergeIntoCart } from './cart-store'

describe('cart-store', () => {
  it('normalizeInputs re-derives from seed and drops unknown ids', () => {
    const lines = normalizeInputs([
      { productId: 'p1', quantity: 2 },
      { productId: 'does-not-exist', quantity: 5 },
    ])
    expect(lines).toHaveLength(1)
    expect(lines[0]?.productId).toBe('p1')
    expect(lines[0]?.priceCents).toBe(12999) // from seed, not client
    expect(lines[0]?.quantity).toBe(2)
  })

  it('clamps quantity to seed stock', () => {
    // p2 is out of stock (0) in seed → dropped
    expect(normalizeInputs([{ productId: 'p2', quantity: 3 }])).toHaveLength(0)
    // p1 stock is 8 → capped
    expect(normalizeInputs([{ productId: 'p1', quantity: 999 }])[0]?.quantity).toBe(8)
  })

  it('mergeIntoCart sums with existing', () => {
    saveCart('u1', normalizeInputs([{ productId: 'p1', quantity: 2 }]))
    const merged = mergeIntoCart('u1', [{ productId: 'p1', quantity: 3 }])
    expect(merged.find((l) => l.productId === 'p1')?.quantity).toBe(5)
    expect(getCart('u1').find((l) => l.productId === 'p1')?.quantity).toBe(5)
  })
})
