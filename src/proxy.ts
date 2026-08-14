import { NextResponse, type NextRequest } from 'next/server'
import { verifySessionJwt } from '@/lib/server/session'
import { decideAuth } from '@/lib/server/auth-redirect'

// Next 16: this is the renamed `middleware` (Node.js runtime by default).
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl
  const token = request.cookies.get('session')?.value

  let session: { role: string } | null = null
  if (token) {
    try {
      const claims = await verifySessionJwt(token)
      session = { role: claims.role }
    } catch {
      session = null
    }
  }

  const decision = decideAuth(pathname, search, session)
  if (decision.type === 'redirect') {
    const res = NextResponse.redirect(new URL(decision.to, request.url))
    if (token && !session) res.cookies.delete('session') // clear an invalid/expired cookie
    return res
  }
  return NextResponse.next()
}

export const config = { matcher: ['/seller/:path*', '/checkout', '/orders/:path*'] }
