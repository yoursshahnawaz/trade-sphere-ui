import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { createSessionJwt, verifySessionJwt, type SessionClaims } from './session'
import type { SessionUser } from '@/types'

const COOKIE = 'session'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

/** Reject state-changing requests whose Origin is not same-site (defense-in-depth). */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true // non-browser callers / tests send no Origin
  const host = request.headers.get('host')
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await createSessionJwt({ sub: user.uid, email: user.email, role: user.role })
  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE)
}

/** Read + verify the session cookie; returns the claims (uid is `sub`) or null. */
export async function requireSession(): Promise<SessionClaims | null> {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  try {
    return await verifySessionJwt(token)
  } catch {
    return null
  }
}
