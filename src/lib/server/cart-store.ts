import type { CartLine } from '@/types'
import type { CartInput } from '@/lib/schemas/cart-schema'
import { seedProducts } from '@/mocks/seed/products'
import { mergeCarts, clampQuantity } from '@/features/cart/cart-merge'

const carts = new Map<string, CartLine[]>()
const productById = new Map(seedProducts.map((p) => [p.id, p]))

/** Trust only productId + quantity from the client; re-derive the rest from seed. */
export function normalizeInputs(inputs: CartInput): CartLine[] {
  const lines: CartLine[] = []
  for (const { productId, quantity } of inputs) {
    const p = productById.get(productId)
    if (!p || p.stock === 0) continue
    const q = clampQuantity(quantity, p.stock)
    if (q <= 0) continue
    lines.push({
      productId: p.id,
      title: p.title,
      priceCents: p.priceCents,
      imageUrl: p.imageUrl,
      stock: p.stock,
      quantity: q,
    })
  }
  return lines
}

export function getCart(uid: string): CartLine[] {
  return carts.get(uid) ?? []
}

export function saveCart(uid: string, lines: CartLine[]): CartLine[] {
  carts.set(uid, lines)
  return lines
}

export function mergeIntoCart(uid: string, inputs: CartInput): CartLine[] {
  return saveCart(uid, mergeCarts(getCart(uid), normalizeInputs(inputs)))
}
