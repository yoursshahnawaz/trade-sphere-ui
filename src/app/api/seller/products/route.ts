import { NextResponse, type NextRequest } from 'next/server'
import { isSameOrigin } from '@/lib/server/http'
import { requireSeller, denySeller } from '@/lib/server/seller-auth'
import { sellerProductInputSchema } from '@/lib/schemas/seller-product-schema'
import { listSellerProducts, addSellerProduct } from '@/lib/server/seller-store'

export async function GET(): Promise<NextResponse> {
  const gate = await requireSeller()
  if ('status' in gate) return denySeller(gate.status)
  return NextResponse.json({ products: listSellerProducts(gate.session.sub) })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const gate = await requireSeller()
  if ('status' in gate) return denySeller(gate.status)

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const parsed = sellerProductInputSchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  if (parsed.data.salePriceCents != null && parsed.data.salePriceCents >= parsed.data.priceCents) {
    return NextResponse.json({ error: 'sale price must be less than price' }, { status: 400 })
  }

  const product = addSellerProduct(gate.session.sub, parsed.data)
  return NextResponse.json({ product }, { status: 201 })
}
