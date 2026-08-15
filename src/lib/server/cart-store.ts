import type { CartLine } from '@/types'
import type { CartInput } from '@/lib/schemas/cart-schema'
import { getProduct } from './product-store'
import { effectivePriceCents } from '@/lib/product-price'
import { mergeCarts, clampQuantity } from '@/features/cart/cart-merge'

const carts = new Map<string, CartLine[]>()

/** Trust only productId + quantity from the client; re-derive the rest (incl. the
 *  effective/sale price) from the unified catalog. */
export function normalizeInputs(inputs: CartInput): CartLine[] {
  const lines: CartLine[] = []
  for (const { productId, quantity } of inputs) {
    const p = getProduct(productId)
    if (!p || p.stock === 0) continue
    const q = clampQuantity(quantity, p.stock)
    if (q <= 0) continue
    lines.push({
      productId: p.id,
      title: p.title,
      priceCents: effectivePriceCents(p),
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
