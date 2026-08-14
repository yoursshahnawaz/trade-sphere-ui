import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySessionJwt } from '@/lib/server/session'
import type { SessionUser } from '@/types'

export async function GET(): Promise<NextResponse> {
  const token = (await cookies()).get('session')?.value
  if (!token) return NextResponse.json({ user: null }, { status: 200 })
  try {
    const claims = await verifySessionJwt(token)
    const user: SessionUser = { uid: claims.sub, email: claims.email, role: claims.role }
    return NextResponse.json({ user }, { status: 200 })
  } catch {
    return NextResponse.json({ user: null }, { status: 200 })
  }
}
