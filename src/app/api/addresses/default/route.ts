import { NextResponse, type NextRequest } from 'next/server'
import { requireSession, isSameOrigin } from '@/lib/server/http'
import { setDefaultAddress } from '@/lib/server/address-book'

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
  const index = (raw as { index?: unknown }).index
  if (typeof index !== 'number' || !Number.isInteger(index)) {
    return NextResponse.json({ error: 'invalid index' }, { status: 400 })
  }
  return NextResponse.json({ addresses: await setDefaultAddress(session.sub, index) })
}
