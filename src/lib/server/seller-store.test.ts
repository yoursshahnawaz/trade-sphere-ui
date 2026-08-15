// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { listSellerProducts, addSellerProduct, getSellerAnalytics } from './seller-store'

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
