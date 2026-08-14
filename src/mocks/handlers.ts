import { http, HttpResponse } from 'msw'
import { normalizeInputs } from '@/lib/server/cart-store'
import { mergeCarts } from '@/features/cart/cart-merge'
import { queryProducts, getProduct, listCategories } from '@/lib/server/product-store'
import type { CartLine } from '@/types'

type CartInputBody = { items: { productId: string; quantity: number }[] }
let mswCart: CartLine[] = []

export const handlers = [
  http.get('/api/health', () => HttpResponse.json({ status: 'ok' })),
  http.get('/api/products', ({ request }) => {
    const sp = new URL(request.url).searchParams
    return HttpResponse.json(
      queryProducts({
        page: Number(sp.get('page') ?? '1'),
        limit: Number(sp.get('limit') ?? '12'),
        q: sp.get('q') ?? undefined,
        category: sp.get('category') ?? undefined,
        minPrice: sp.get('minPrice') ? Number(sp.get('minPrice')) : undefined,
        maxPrice: sp.get('maxPrice') ? Number(sp.get('maxPrice')) : undefined,
        inStock: sp.get('inStock') === 'true' ? true : undefined,
      }),
    )
  }),
  http.get('/api/products/:id', ({ params }) => {
    const product = getProduct(String(params.id))
    return product ? HttpResponse.json({ product }) : new HttpResponse(null, { status: 404 })
  }),
  http.get('/api/categories', () => HttpResponse.json({ categories: listCategories() })),
  http.get('/api/cart', () => HttpResponse.json({ items: mswCart })),
  http.put('/api/cart', async ({ request }) => {
    const body = (await request.json()) as CartInputBody
    mswCart = normalizeInputs(body.items)
    return HttpResponse.json({ items: mswCart })
  }),
  http.post('/api/cart/merge', async ({ request }) => {
    const body = (await request.json()) as CartInputBody
    mswCart = mergeCarts(mswCart, normalizeInputs(body.items))
    return HttpResponse.json({ items: mswCart })
  }),
]
