// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { queryProducts, getProduct, listCategories } from './product-store'

describe('product-store', () => {
  it('paginates with nextPage (36 products, 12/page)', () => {
    const p1 = queryProducts({ page: 1, limit: 12 })
    expect(p1.items).toHaveLength(12)
    expect(p1.nextPage).toBe(2)
    const p3 = queryProducts({ page: 3, limit: 12 })
    expect(p3.nextPage).toBeNull()
  })

  it('filters by category', () => {
    const r = queryProducts({ page: 1, limit: 48, category: 'audio' })
    expect(r.items.length).toBeGreaterThan(0)
    expect(r.items.every((p) => p.category === 'audio')).toBe(true)
  })

  it('filters inStock', () => {
    const r = queryProducts({ page: 1, limit: 48, inStock: true })
    expect(r.items.every((p) => p.stock > 0)).toBe(true)
  })

  it('filters by price range', () => {
    const r = queryProducts({ page: 1, limit: 48, minPrice: 10000, maxPrice: 15000 })
    expect(r.items.every((p) => p.priceCents >= 10000 && p.priceCents <= 15000)).toBe(true)
  })

  it('searches by title', () => {
    const r = queryProducts({ page: 1, limit: 48, q: 'webcam' })
    expect(r.items.some((p) => p.id === 'p3')).toBe(true)
  })

  it('getProduct + listCategories', () => {
    expect(getProduct('p1')?.title).toContain('Headphones')
    expect(getProduct('nope')).toBeUndefined()
    expect(listCategories()).toContain('audio')
  })
})
