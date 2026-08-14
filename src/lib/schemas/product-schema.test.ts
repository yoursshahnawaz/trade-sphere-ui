import { describe, it, expect } from 'vitest'
import { productSchema } from './product-schema'

const valid = {
  id: 'p1',
  title: 'Wireless Headphones',
  priceCents: 12999,
  stock: 8,
  category: 'audio',
  imageUrl: 'https://example.com/img.webp',
}

describe('productSchema', () => {
  it('accepts a valid product', () => {
    expect(productSchema.parse(valid)).toEqual(valid)
  })

  it('rejects a negative price', () => {
    expect(productSchema.safeParse({ ...valid, priceCents: -1 }).success).toBe(false)
  })

  it('rejects a non-integer stock', () => {
    expect(productSchema.safeParse({ ...valid, stock: 2.5 }).success).toBe(false)
  })

  it('rejects a missing title', () => {
    expect(productSchema.safeParse({ ...valid, title: '' }).success).toBe(false)
  })
})
