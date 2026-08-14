import type { OrderInput } from '@/lib/schemas/order-schema'

export async function placeOrder(input: OrderInput): Promise<string> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('Order failed')
  const data = (await res.json()) as { order: { id: string } }
  return data.order.id
}
