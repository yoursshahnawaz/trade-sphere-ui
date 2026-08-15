import { NextResponse, type NextRequest } from 'next/server'
import { reviewInputSchema } from '@/lib/schemas/review-schema'
import { requireSession, isSameOrigin } from '@/lib/server/http'
import { getProduct } from '@/lib/server/product-store'
import { getProfile } from '@/lib/server/user-profile'
import { addReview } from '@/lib/server/review-store'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const session = await requireSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  // Sellers shop nowhere and can't review; only buyers leave reviews.
  if (session.role !== 'buyer') return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const { id } = await params
  const product = await getProduct(id)
  if (!product) return NextResponse.json({ error: 'not found' }, { status: 404 })

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const parsed = reviewInputSchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: 'invalid body' }, { status: 400 })

  const profile = await getProfile(session.sub)
  // Byline is public on the product page — never derive it from the login email.
  const authorName = profile?.name || 'A shopper'

  const review = await addReview(id, session.sub, authorName, parsed.data)
  return NextResponse.json({ review }, { status: 201 })
}
