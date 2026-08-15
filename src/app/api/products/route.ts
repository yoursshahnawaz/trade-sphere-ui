import { NextResponse } from 'next/server'
import { productQuerySchema } from '@/lib/schemas/product-query-schema'
import { queryProducts } from '@/lib/server/product-store'

export async function GET(request: Request): Promise<NextResponse> {
  const sp = new URL(request.url).searchParams
  const parsed = productQuerySchema.safeParse({
    page: sp.get('page') ?? undefined,
    limit: sp.get('limit') ?? undefined,
    q: sp.get('q') ?? undefined,
    category: sp.get('category') ?? undefined,
    minPrice: sp.get('minPrice') ?? undefined,
    maxPrice: sp.get('maxPrice') ?? undefined,
    inStock: sp.get('inStock') ?? undefined,
  })
  if (!parsed.success) return NextResponse.json({ error: 'invalid query' }, { status: 400 })
  return NextResponse.json(await queryProducts(parsed.data), { status: 200 })
}
