import type { Order } from '@/lib/schemas/order-schema'
import type { Address } from '@/lib/schemas/address-schema'
import type { PaymentStored } from '@/lib/schemas/payment-schema'
import type { OrderTotals } from '@/lib/order-totals'
import type { CartLine } from '@/types'

export interface StoredOrder extends Order {
  uid: string
}

export interface CreateOrderInput {
  uid: string
  items: CartLine[]
  shipping: Address
  billing: Address
  payment: PaymentStored
  totals: OrderTotals
}

// Shared via globalThis so route handlers AND server components (the confirmation
// page) read the same in-memory store in dev, where module state isn't shared.
const globalForOrders = globalThis as unknown as { __orderStore?: Map<string, StoredOrder> }
const orders = globalForOrders.__orderStore ?? (globalForOrders.__orderStore = new Map<string, StoredOrder>())

export function createOrder(input: CreateOrderInput): StoredOrder {
  const order: StoredOrder = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  }
  orders.set(order.id, order)
  return order
}

export function getOrder(id: string): StoredOrder | undefined {
  return orders.get(id)
}
