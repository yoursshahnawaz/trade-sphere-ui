// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  listSellerProducts,
  addSellerProduct,
  getSellerProduct,
  updateSellerProduct,
  removeSellerProduct,
  findSellerProductById,
  getSellerAnalytics,
} from './seller-store'

describe('seller-store', () => {
  it('lazy-seeds a new seller with products scoped to that uid', () => {
    const products = listSellerProducts('seller-a')
    expect(products.length).toBeGreaterThan(0)
    expect(products.every((p) => p.sellerUid === 'seller-a')).toBe(true)
  })

  it('addSellerProduct appends and defaults imageUrl when omitted', () => {
    const before = listSellerProducts('seller-b').length
    const created = addSellerProduct('seller-b', {
      title: 'New Gadget',
      category: 'home',
      priceCents: 4999,
      stock: 10,
      status: 'active',
    })
    expect(created.imageUrl).toMatch(/^https:\/\/picsum\.photos\/seed\//)
    expect(listSellerProducts('seller-b')).toHaveLength(before + 1)
  })

  it('seeds unique ids per seller (for the unified catalog)', () => {
    const a = listSellerProducts('seller-uniq-1')[0]!
    const b = listSellerProducts('seller-uniq-2')[0]!
    expect(a.id).not.toBe(b.id)
    expect(findSellerProductById(a.id)?.sellerUid).toBe('seller-uniq-1')
  })

  it('updateSellerProduct patches an owned product and clears offers via undefined', () => {
    const created = addSellerProduct('seller-upd', {
      title: 'Widget',
      category: 'home',
      priceCents: 5000,
      salePriceCents: 4000,
      stock: 5,
      status: 'active',
    })
    const updated = updateSellerProduct('seller-upd', created.id, { stock: 12, salePriceCents: undefined })
    expect(updated?.stock).toBe(12)
    expect(updated?.salePriceCents).toBeUndefined()
    expect(getSellerProduct('seller-upd', created.id)?.stock).toBe(12)
  })

  it('updateSellerProduct returns undefined for a foreign product', () => {
    const mine = addSellerProduct('owner-x', { title: 'Mine', category: 'home', priceCents: 999, stock: 1, status: 'active' })
    expect(updateSellerProduct('someone-else', mine.id, { stock: 99 })).toBeUndefined()
  })

  it('removeSellerProduct deletes an owned product', () => {
    const created = addSellerProduct('seller-del', { title: 'Bye', category: 'home', priceCents: 999, stock: 1, status: 'active' })
    expect(removeSellerProduct('seller-del', created.id)).toBe(true)
    expect(getSellerProduct('seller-del', created.id)).toBeUndefined()
    expect(removeSellerProduct('seller-del', created.id)).toBe(false)
  })

  it('analytics are deterministic with static month labels', () => {
    const a = getSellerAnalytics('seller-c')
    const b = getSellerAnalytics('seller-c')
    expect(a).toEqual(b) // identical output regardless of wall-clock
    expect(a.revenueSeries.map((m) => m.month)).toEqual([
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ])
    expect(a.topProducts.length).toBeLessThanOrEqual(5)
    expect(a.kpis.totalSalesCents).toBe(a.revenueSeries.reduce((n, m) => n + m.revenue, 0))
  })
})
