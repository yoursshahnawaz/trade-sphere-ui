import { http, HttpResponse } from 'msw'
import { normalizeInputs } from '@/lib/server/cart-store'
import { mergeCarts } from '@/features/cart/cart-merge'
import { queryProducts, getProduct, listCategories } from '@/lib/server/product-store'
import type { CartLine } from '@/types'
import type { Address } from '@/lib/schemas/address-schema'
import type { SellerProduct } from '@/lib/schemas/seller-product-schema'

type CartInputBody = { items: { productId: string; quantity: number }[] }
let mswCart: CartLine[] = []
let mswAddresses: Address[] = []
let mswSellerProducts: SellerProduct[] = [
  { id: 'sp1', sellerUid: 'msw', title: 'Wireless Earbuds Pro', category: 'audio', priceCents: 7999, stock: 24, imageUrl: 'https://picsum.photos/seed/sp1/600/600', status: 'active' },
  { id: 'sp2', sellerUid: 'msw', title: 'Ergonomic Mouse', category: 'peripherals', priceCents: 3499, stock: 3, imageUrl: 'https://picsum.photos/seed/sp2/600/600', status: 'active' },
  { id: 'sp6', sellerUid: 'msw', title: 'Studio Microphone', category: 'audio', priceCents: 12999, stock: 7, imageUrl: 'https://picsum.photos/seed/sp6/600/600', status: 'draft' },
]

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
  http.post('/api/orders', () => HttpResponse.json({ order: { id: 'order-test' } }, { status: 201 })),
  http.get('/api/addresses', () => HttpResponse.json({ addresses: mswAddresses })),
  http.post('/api/addresses', async ({ request }) => {
    const a = (await request.json()) as Address
    mswAddresses = [...mswAddresses, a]
    return HttpResponse.json({ addresses: mswAddresses }, { status: 201 })
  }),
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
  http.get('/api/seller/products', () => HttpResponse.json({ products: mswSellerProducts })),
  http.post('/api/seller/products', async ({ request }) => {
    const input = (await request.json()) as Partial<SellerProduct>
    const product: SellerProduct = {
      id: `msw-${mswSellerProducts.length + 1}`,
      sellerUid: 'msw',
      title: input.title ?? 'Untitled',
      category: input.category ?? 'home',
      description: input.description,
      priceCents: input.priceCents ?? 0,
      stock: input.stock ?? 0,
      imageUrl: input.imageUrl ?? 'https://picsum.photos/seed/msw/600/600',
      status: input.status ?? 'active',
    }
    mswSellerProducts = [...mswSellerProducts, product]
    return HttpResponse.json({ product }, { status: 201 })
  }),
  http.get('/api/seller/products/:id', ({ params }) => {
    const product = mswSellerProducts.find((p) => p.id === params.id)
    return product ? HttpResponse.json({ product }) : new HttpResponse(null, { status: 404 })
  }),
  http.patch('/api/seller/products/:id', async ({ params, request }) => {
    const idx = mswSellerProducts.findIndex((p) => p.id === params.id)
    if (idx < 0) return new HttpResponse(null, { status: 404 })
    const { salePriceCents, ...rest } = (await request.json()) as Partial<SellerProduct> & {
      salePriceCents?: number | null
    }
    const updated: SellerProduct = { ...mswSellerProducts[idx]!, ...rest }
    if (salePriceCents !== undefined) updated.salePriceCents = salePriceCents ?? undefined
    mswSellerProducts = mswSellerProducts.map((p, i) => (i === idx ? updated : p))
    return HttpResponse.json({ product: updated })
  }),
  http.delete('/api/seller/products/:id', ({ params }) => {
    mswSellerProducts = mswSellerProducts.filter((p) => p.id !== params.id)
    return HttpResponse.json({ ok: true })
  }),
]
