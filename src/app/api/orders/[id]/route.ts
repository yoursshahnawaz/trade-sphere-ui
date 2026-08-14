import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/server/http'
import { getOrder } from '@/lib/server/order-store'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await requireSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const order = getOrder(id)
  if (!order || order.uid !== session.sub) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  return NextResponse.json({ order }, { status: 200 })
}
