import { cartLinesSchema } from '@/lib/schemas/cart-schema'
import type { CartLine } from '@/types'

function toInputs(items: CartLine[]): { productId: string; quantity: number }[] {
  return items.map(({ productId, quantity }) => ({ productId, quantity }))
}

async function readItems(res: Response): Promise<CartLine[]> {
  if (!res.ok) throw new Error('Cart request failed')
  const data = (await res.json()) as { items: unknown }
  return cartLinesSchema.parse(data.items)
}

export async function getCart(): Promise<CartLine[]> {
  return readItems(await fetch('/api/cart'))
}

export async function putCart(items: CartLine[]): Promise<CartLine[]> {
  return readItems(
    await fetch('/api/cart', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: toInputs(items) }),
    }),
  )
}

export async function mergeCart(items: CartLine[]): Promise<CartLine[]> {
  return readItems(
    await fetch('/api/cart/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: toInputs(items) }),
    }),
  )
}
