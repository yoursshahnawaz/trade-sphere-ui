import { NextResponse } from 'next/server'
import { getProduct } from '@/lib/server/product-store'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params
  const product = getProduct(id)
  if (!product) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ product }, { status: 200 })
}
