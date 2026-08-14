import { describe, it, expect } from 'vitest'
import { mergeCarts, clampQuantity } from './cart-merge'
import type { CartLine } from '@/types'

const line = (productId: string, quantity: number, stock = 10, priceCents = 1000): CartLine => ({
  productId,
  title: productId,
  priceCents,
  imageUrl: 'https://example.com/i.webp',
  stock,
  quantity,
})

describe('clampQuantity', () => {
  it('clamps to [0, stock]', () => {
    expect(clampQuantity(5, 3)).toBe(3)
    expect(clampQuantity(-2, 3)).toBe(0)
    expect(clampQuantity(2, 3)).toBe(2)
  })
})

describe('mergeCarts', () => {
  it('sums quantities for duplicate products', () => {
    const r = mergeCarts([line('p1', 3)], [line('p1', 2), line('p2', 1)])
    expect(r.find((l) => l.productId === 'p1')?.quantity).toBe(5)
    expect(r.find((l) => l.productId === 'p2')?.quantity).toBe(1)
  })

  it('caps the summed quantity at stock', () => {
    const r = mergeCarts([line('p1', 6, 8)], [line('p1', 5, 8)])
    expect(r.find((l) => l.productId === 'p1')?.quantity).toBe(8)
  })

  it('keeps base (server) metadata when snapshots disagree', () => {
    const r = mergeCarts([line('p1', 1, 8, 9999)], [line('p1', 1, 3, 1)])
    const p1 = r.find((l) => l.productId === 'p1')
    expect(p1?.priceCents).toBe(9999)
    expect(p1?.stock).toBe(8)
    expect(p1?.quantity).toBe(2)
  })

  it('handles empty sides', () => {
    expect(mergeCarts([], [line('p1', 2)])).toHaveLength(1)
    expect(mergeCarts([line('p1', 2)], [])).toHaveLength(1)
  })
})
