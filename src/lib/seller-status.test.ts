import { describe, it, expect } from 'vitest'
import { productStatus } from './seller-status'

describe('productStatus', () => {
  it('draft overrides stock', () => {
    expect(productStatus({ stock: 10, status: 'draft' })).toBe('Draft')
  })
  it('zero stock is out of stock', () => {
    expect(productStatus({ stock: 0, status: 'active' })).toBe('Out of Stock')
  })
  it('below 5 is low stock', () => {
    expect(productStatus({ stock: 4, status: 'active' })).toBe('Low Stock')
  })
  it('5 or more is in stock', () => {
    expect(productStatus({ stock: 5, status: 'active' })).toBe('In Stock')
  })
})
