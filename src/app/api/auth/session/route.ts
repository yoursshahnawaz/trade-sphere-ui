import { NextResponse, type NextRequest } from 'next/server'
import { verifyFirebaseIdToken } from '@/lib/server/firebase-verify'
import { upsertUser } from '@/lib/server/user-store'
import { isSameOrigin, setSessionCookie, clearSessionCookie } from '@/lib/server/http'
import type { SessionUser } from '@/types'

// Login + buyer registration. Role is NEVER taken from the body here — new users
// default to 'buyer' and existing users keep their stored role. Seller access is
// granted only by /api/auth/seller-register.
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  let body: { idToken?: string }
  try {
    body = (await request.json()) as { idToken?: string }
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  if (!body.idToken) return NextResponse.json({ error: 'idToken required' }, { status: 400 })

  let decoded
  try {
    decoded = await verifyFirebaseIdToken(body.idToken)
  } catch {
    return NextResponse.json({ error: 'invalid token' }, { status: 401 })
  }

  const stored = upsertUser({ uid: decoded.sub, email: decoded.email })
  const user: SessionUser = { uid: stored.uid, email: stored.email, role: stored.role }
  await setSessionCookie(user)
  return NextResponse.json({ user }, { status: 200 })
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  await clearSessionCookie()
  return NextResponse.json({ ok: true }, { status: 200 })
}
