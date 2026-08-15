import type { Order } from '@/lib/schemas/order-schema'
import type { Address } from '@/lib/schemas/address-schema'
import type { PaymentStored } from '@/lib/schemas/payment-schema'
import type { OrderTotals } from '@/lib/order-totals'
import type { CartLine } from '@/types'
import { getDb } from './supabase'

export type OrderStatus = 'Processing' | 'Shipped' | 'Delivered'

export interface StoredOrder extends Order {
  uid: string
  status: OrderStatus
}

export interface CreateOrderInput {
  uid: string
  items: CartLine[]
  shipping: Address
  billing: Address
  payment: PaymentStored
  totals: OrderTotals
}

interface OrderRow {
  id: string
  uid: string
  subtotal_cents: number
  tax_cents: number
  shipping_cents: number
  total_cents: number
  shipping: Address
  billing: Address
  payment: PaymentStored
  status: OrderStatus
  created_at: string
}

interface OrderItemRow {
  order_id: string
  product_id: string
  title: string
  price_cents: number
  quantity: number
  image_url: string
}

function toStoredOrder(o: OrderRow, items: OrderItemRow[]): StoredOrder {
  return {
    id: o.id,
    uid: o.uid,
    status: o.status,
    createdAt: o.created_at,
    shipping: o.shipping,
    billing: o.billing,
    payment: o.payment,
    totals: {
      subtotalCents: o.subtotal_cents,
      taxCents: o.tax_cents,
      shippingCents: o.shipping_cents,
      totalCents: o.total_cents,
    },
    items: items.map((i) => ({
      productId: i.product_id,
      title: i.title,
      priceCents: i.price_cents,
      imageUrl: i.image_url,
      stock: 0, // not tracked on the order line; irrelevant after purchase
      quantity: i.quantity,
    })),
  }
}

export async function createOrder(input: CreateOrderInput): Promise<StoredOrder> {
  const { data } = await getDb()
    .from('orders')
    .insert({
      uid: input.uid,
      subtotal_cents: input.totals.subtotalCents,
      tax_cents: input.totals.taxCents,
      shipping_cents: input.totals.shippingCents,
      total_cents: input.totals.totalCents,
      shipping: input.shipping,
      billing: input.billing,
      payment: input.payment,
    })
    .select('*')
    .single()
  const row = data as OrderRow
  await getDb().from('order_items').insert(
    input.items.map((i) => ({
      order_id: row.id,
      product_id: i.productId,
      title: i.title,
      price_cents: i.priceCents,
      quantity: i.quantity,
      image_url: i.imageUrl,
    })),
  )
  // DB-generated: id, status, created_at. Everything else echoes the input.
  return {
    id: row.id,
    uid: row.uid,
    status: row.status,
    createdAt: row.created_at,
    items: input.items,
    shipping: input.shipping,
    billing: input.billing,
    payment: input.payment,
    totals: input.totals,
  }
}

export async function getOrder(id: string): Promise<StoredOrder | undefined> {
  const { data } = await getDb().from('orders').select('*').eq('id', id).maybeSingle()
  if (!data) return undefined
  const { data: itemRows } = await getDb().from('order_items').select('*').eq('order_id', id)
  return toStoredOrder(data as OrderRow, (itemRows ?? []) as OrderItemRow[])
}

export async function listOrdersByUid(uid: string): Promise<StoredOrder[]> {
  const { data } = await getDb()
    .from('orders')
    .select('*')
    .eq('uid', uid)
    .order('created_at', { ascending: false }) // newest first
  const orders = (data ?? []) as OrderRow[]
  if (orders.length === 0) return []

  const { data: itemData } = await getDb()
    .from('order_items')
    .select('*')
    .in('order_id', orders.map((o) => o.id))
  const byOrder = new Map<string, OrderItemRow[]>()
  for (const it of (itemData ?? []) as OrderItemRow[]) {
    const list = byOrder.get(it.order_id) ?? []
    list.push(it)
    byOrder.set(it.order_id, list)
  }
  return orders.map((o) => toStoredOrder(o, byOrder.get(o.id) ?? []))
}
