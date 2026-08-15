import type { CartLine } from '@/types'
import type { CartInput } from '@/lib/schemas/cart-schema'
import { getProduct } from './product-store'
import { effectivePriceCents } from '@/lib/product-price'
import { mergeCarts, clampQuantity } from '@/features/cart/cart-merge'

// The cart itself stays in server memory (keyed by uid); line data is re-derived
// from the catalog (Supabase) so the client can only assert productId + quantity.
const carts = new Map<string, CartLine[]>()

export async function normalizeInputs(inputs: CartInput): Promise<CartLine[]> {
  const lines: CartLine[] = []
  for (const { productId, quantity } of inputs) {
    const p = await getProduct(productId)
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

export async function mergeIntoCart(uid: string, inputs: CartInput): Promise<CartLine[]> {
  return saveCart(uid, mergeCarts(getCart(uid), await normalizeInputs(inputs)))
}
