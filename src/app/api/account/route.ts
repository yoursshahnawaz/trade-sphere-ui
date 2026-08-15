import { NextResponse, type NextRequest } from 'next/server'
import { requireSession, isSameOrigin } from '@/lib/server/http'
import { profileSchema } from '@/lib/schemas/profile-schema'
import { getProfile, setProfile } from '@/lib/server/user-profile'
import { getSellerInfo, setSellerInfo } from '@/lib/server/sellers'

export async function GET(): Promise<NextResponse> {
  const session = await requireSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  return NextResponse.json({ profile: await getProfile(session.sub) })
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const session = await requireSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const parsed = profileSchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: 'invalid body' }, { status: 400 })

  const profile = await setProfile(session.sub, parsed.data)
  // A seller's name becomes their storefront name shown to buyers (realtime).
  if (session.role === 'seller') {
    const current = await getSellerInfo(session.sub)
    await setSellerInfo(session.sub, { name: profile.name, location: current.location })
  }
  return NextResponse.json({ profile })
}
