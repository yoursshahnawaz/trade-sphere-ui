import { NextResponse, type NextRequest } from 'next/server'
import { orderInputSchema } from '@/lib/schemas/order-schema'
import { requireSession, isSameOrigin } from '@/lib/server/http'
import { getCart, saveCart } from '@/lib/server/cart-store'
import { createOrder } from '@/lib/server/order-store'
import { computeTotals } from '@/lib/order-totals'

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const session = await requireSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const parsed = orderInputSchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: 'invalid body' }, { status: 400 })

  // Line items + totals are derived from the SERVER cart — never from the client body.
  const items = getCart(session.sub)
  if (items.length === 0) return NextResponse.json({ error: 'cart empty' }, { status: 400 })
  const subtotal = items.reduce((n, i) => n + i.priceCents * i.quantity, 0)
  const totals = computeTotals(subtotal)

  const order = await createOrder({
    uid: session.sub,
    items,
    shipping: parsed.data.shipping,
    billing: parsed.data.billing,
    payment: parsed.data.payment,
    totals,
  })
  saveCart(session.sub, []) // clear the cart on successful order
  return NextResponse.json({ order }, { status: 201 })
}
