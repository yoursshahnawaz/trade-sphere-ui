import type { CartLine } from '@/types'

export function clampQuantity(quantity: number, stock: number): number {
  return Math.max(0, Math.min(quantity, stock))
}

/**
 * Union by productId. On a match, sum quantities capped at stock; the `base`
 * (server-authoritative) line's metadata wins. Lines resolving to 0 are dropped.
 */
export function mergeCarts(base: CartLine[], incoming: CartLine[]): CartLine[] {
  const byId = new Map<string, CartLine>()
  for (const line of base) byId.set(line.productId, { ...line })
  for (const line of incoming) {
    const existing = byId.get(line.productId)
    if (existing) {
      existing.quantity = clampQuantity(existing.quantity + line.quantity, existing.stock)
    } else {
      byId.set(line.productId, { ...line, quantity: clampQuantity(line.quantity, line.stock) })
    }
  }
  return [...byId.values()].filter((line) => line.quantity > 0)
}
