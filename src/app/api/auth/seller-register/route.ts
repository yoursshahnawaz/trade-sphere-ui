import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { verifyFirebaseIdToken } from '@/lib/server/firebase-verify'
import { upsertUser } from '@/lib/server/user-store'
import { isSameOrigin, setSessionCookie } from '@/lib/server/http'
import type { SessionUser } from '@/types'

const bodySchema = z.object({ idToken: z.string().min(1), storeName: z.string().min(2) })

// The ONLY endpoint that grants the 'seller' role. A brand-new uid becomes a
// seller (with storeName); an existing user keeps their current role.
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: 'invalid body' }, { status: 400 })

  let decoded
  try {
    decoded = await verifyFirebaseIdToken(parsed.data.idToken)
  } catch {
    return NextResponse.json({ error: 'invalid token' }, { status: 401 })
  }

  const stored = upsertUser({
    uid: decoded.sub,
    email: decoded.email,
    role: 'seller',
    storeName: parsed.data.storeName,
  })
  const user: SessionUser = { uid: stored.uid, email: stored.email, role: stored.role }
  await setSessionCookie(user)
  return NextResponse.json({ user }, { status: 200 })
}
