import { NextResponse } from 'next/server'
import { requireSession } from './http'
import type { SessionClaims } from './session'

/** Seller-route gate that preserves the 401 (no session) vs 403 (wrong role) distinction. */
export async function requireSeller(): Promise<{ session: SessionClaims } | { status: 401 | 403 }> {
  const session = await requireSession()
  if (!session) return { status: 401 }
  if (session.role !== 'seller') return { status: 403 }
  return { session }
}

export function denySeller(status: 401 | 403): NextResponse {
  return NextResponse.json({ error: status === 401 ? 'unauthorized' : 'forbidden' }, { status })
}
