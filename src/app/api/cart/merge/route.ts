import { NextResponse, type NextRequest } from 'next/server'
import { cartInputSchema } from '@/lib/schemas/cart-schema'
import { mergeIntoCart } from '@/lib/server/cart-store'
import { requireSession, isSameOrigin } from '@/lib/server/http'

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
  const parsed = cartInputSchema.safeParse((raw as { items?: unknown }).items)
  if (!parsed.success) return NextResponse.json({ error: 'invalid body' }, { status: 400 })

  return NextResponse.json({ items: await mergeIntoCart(session.sub, parsed.data) }, { status: 200 })
}
