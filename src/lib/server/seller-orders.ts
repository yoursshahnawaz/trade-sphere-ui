import { listSellerProducts } from './seller-store'
import { effectivePriceCents } from '@/lib/product-price'

export type OrderStatus = 'Processing' | 'Shipped' | 'Delivered'

export interface SellerOrderItem {
  title: string
  quantity: number
  priceCents: number
}
export interface SellerOrder {
  id: string
  createdAt: string // deterministic ISO date (never Date.now)
  customer: string
  items: SellerOrderItem[]
  totalCents: number
  status: OrderStatus
}

const CUSTOMERS = [
  'Ada Lovelace',
  'Grace Hopper',
  'Alan Turing',
  'Katherine Johnson',
  'Linus Torvalds',
  'Margaret Hamilton',
  'Dennis Ritchie',
  'Barbara Liskov',
]
const STATUSES: OrderStatus[] = ['Processing', 'Shipped', 'Delivered']

// FNV-1a — stable pseudo-value from a string (deterministic; no Math.random / Date).
function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Deterministic mock orders for a seller's active products. */
export async function listSellerOrders(uid: string): Promise<SellerOrder[]> {
  const products = (await listSellerProducts(uid)).filter((p) => p.status === 'active')
  if (products.length === 0) return []

  const orders: SellerOrder[] = []
  for (let i = 0; i < 8; i++) {
    const h = hash(`${uid}-order-${i}`)
    const itemCount = 1 + (h % 3)
    const items: SellerOrderItem[] = []
    for (let j = 0; j < itemCount; j++) {
      const p = products[(h + j * 7) % products.length]
      if (!p) continue
      items.push({ title: p.title, quantity: 1 + ((h >>> (j + 1)) % 3), priceCents: effectivePriceCents(p) })
    }
    const totalCents = items.reduce((n, it) => n + it.priceCents * it.quantity, 0)
    orders.push({
      id: `${uid}-o${i + 1}`,
      createdAt: `2026-08-${String(28 - i).padStart(2, '0')}`,
      customer: CUSTOMERS[h % CUSTOMERS.length]!,
      items,
      totalCents,
      status: STATUSES[i % STATUSES.length]!,
    })
  }
  return orders
}

export async function getSellerOrder(uid: string, id: string): Promise<SellerOrder | undefined> {
  return (await listSellerOrders(uid)).find((o) => o.id === id)
}

/** Orders not yet delivered — the dashboard "active orders" KPI. */
export async function countActiveOrders(uid: string): Promise<number> {
  return (await listSellerOrders(uid)).filter((o) => o.status !== 'Delivered').length
}
