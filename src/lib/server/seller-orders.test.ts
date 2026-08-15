// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { listSellerOrders, getSellerOrder, countActiveOrders } from './seller-orders'

describe('seller-orders', () => {
  it('generates deterministic orders for a seller', () => {
    const a = listSellerOrders('seller-ord-1')
    const b = listSellerOrders('seller-ord-1')
    expect(a).toEqual(b)
    expect(a.length).toBeGreaterThan(0)
    expect(a.every((o) => o.items.length > 0 && o.totalCents > 0)).toBe(true)
  })

  it('getSellerOrder returns a matching order by id', () => {
    const [first] = listSellerOrders('seller-ord-2')
    expect(getSellerOrder('seller-ord-2', first!.id)).toEqual(first)
    expect(getSellerOrder('seller-ord-2', 'missing')).toBeUndefined()
  })

  it('countActiveOrders counts only non-delivered orders', () => {
    const uid = 'seller-ord-3'
    const orders = listSellerOrders(uid)
    const expected = orders.filter((o) => o.status !== 'Delivered').length
    expect(countActiveOrders(uid)).toBe(expected)
    expect(countActiveOrders(uid)).toBeLessThanOrEqual(orders.length)
  })
})
