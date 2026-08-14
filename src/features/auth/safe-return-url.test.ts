import { describe, it, expect } from 'vitest'
import { safeReturnUrl } from './safe-return-url'

describe('safeReturnUrl', () => {
  it('allows same-origin relative paths', () => {
    expect(safeReturnUrl('/checkout')).toBe('/checkout')
    expect(safeReturnUrl('/seller/dashboard?tab=1')).toBe('/seller/dashboard?tab=1')
  })

  it('rejects absolute and protocol-relative urls', () => {
    expect(safeReturnUrl('https://evil.com')).toBe('/')
    expect(safeReturnUrl('//evil.com')).toBe('/')
    expect(safeReturnUrl('/\\evil.com')).toBe('/')
    expect(safeReturnUrl(null)).toBe('/')
  })
})
