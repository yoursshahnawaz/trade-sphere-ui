import { NextResponse, type NextRequest } from 'next/server'
import { requireSession, isSameOrigin } from '@/lib/server/http'
import type { SessionClaims } from '@/lib/server/session'
import { sellerProductInputSchema } from '@/lib/schemas/seller-product-schema'
import { listSellerProducts, addSellerProduct } from '@/lib/server/seller-store'

// Preserve the 401 (no session) vs 403 (wrong role) distinction the other routes use.
async function requireSeller(): Promise<{ session: SessionClaims } | { status: 401 | 403 }> {
  const session = await requireSession()
  if (!session) return { status: 401 }
  if (session.role !== 'seller') return { status: 403 }
  return { session }
}

function deny(status: 401 | 403): NextResponse {
  return NextResponse.json({ error: status === 401 ? 'unauthorized' : 'forbidden' }, { status })
}

export async function GET(): Promise<NextResponse> {
  const gate = await requireSeller()
  if ('status' in gate) return deny(gate.status)
  return NextResponse.json({ products: listSellerProducts(gate.session.sub) })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const gate = await requireSeller()
  if ('status' in gate) return deny(gate.status)

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const parsed = sellerProductInputSchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: 'invalid body' }, { status: 400 })

  const product = addSellerProduct(gate.session.sub, parsed.data)
  return NextResponse.json({ product }, { status: 201 })
}
