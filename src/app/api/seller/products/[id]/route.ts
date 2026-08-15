import { NextResponse, type NextRequest } from 'next/server'
import { isSameOrigin } from '@/lib/server/http'
import { requireSeller, denySeller } from '@/lib/server/seller-auth'
import { sellerProductPatchSchema, type SellerProduct } from '@/lib/schemas/seller-product-schema'
import { getSellerProduct, updateSellerProduct, removeSellerProduct } from '@/lib/server/seller-store'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params): Promise<NextResponse> {
  const gate = await requireSeller()
  if ('status' in gate) return denySeller(gate.status)
  const { id } = await params
  const product = await getSellerProduct(gate.session.sub, id)
  if (!product) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ product })
}

export async function PATCH(request: NextRequest, { params }: Params): Promise<NextResponse> {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const gate = await requireSeller()
  if ('status' in gate) return denySeller(gate.status)
  const { id } = await params

  const existing = await getSellerProduct(gate.session.sub, id)
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 })

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const parsed = sellerProductPatchSchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: 'invalid body' }, { status: 400 })

  // salePriceCents: null clears the offer; a number sets it; absent leaves it untouched.
  const { salePriceCents, ...rest } = parsed.data
  const patch: Partial<Omit<SellerProduct, 'id' | 'sellerUid'>> = { ...rest }
  if (salePriceCents !== undefined) patch.salePriceCents = salePriceCents ?? undefined

  const merged = { ...existing, ...patch }
  if (merged.salePriceCents != null && merged.salePriceCents >= merged.priceCents) {
    return NextResponse.json({ error: 'sale price must be less than price' }, { status: 400 })
  }

  const product = await updateSellerProduct(gate.session.sub, id, patch)
  return NextResponse.json({ product })
}

export async function DELETE(request: NextRequest, { params }: Params): Promise<NextResponse> {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const gate = await requireSeller()
  if ('status' in gate) return denySeller(gate.status)
  const { id } = await params
  if (!(await removeSellerProduct(gate.session.sub, id))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
