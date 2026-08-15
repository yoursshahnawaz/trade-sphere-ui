import { http, HttpResponse } from 'msw'
import type { CartLine } from '@/types'
import type { Address } from '@/lib/schemas/address-schema'
import type { SellerProduct } from '@/lib/schemas/seller-product-schema'

// MSW is a TEST-only mock layer: it returns canned data and never touches the
// real (Supabase-backed) stores, so the suite stays fast, isolated, and offline.
type CartInputBody = { items: { productId: string; quantity: number }[] }
let mswCart: CartLine[] = []
let mswAddresses: Address[] = []
let mswSellerProducts: SellerProduct[] = [
  { id: 'sp1', sellerUid: 'msw', title: 'Wireless Earbuds Pro', category: 'audio', priceCents: 799900, stock: 24, imageUrl: 'https://picsum.photos/seed/sp1/600/600', status: 'active' },
  { id: 'sp2', sellerUid: 'msw', title: 'Ergonomic Mouse', category: 'peripherals', priceCents: 349900, stock: 3, imageUrl: 'https://picsum.photos/seed/sp2/600/600', status: 'active' },
  { id: 'sp6', sellerUid: 'msw', title: 'Studio Microphone', category: 'audio', priceCents: 1299900, stock: 7, imageUrl: 'https://picsum.photos/seed/sp6/600/600', status: 'draft' },
]

const CATEGORIES = ['audio', 'peripherals', 'wearables', 'home', 'gaming']
const SAMPLE_PRODUCTS = [
  { id: 'aud-1', title: 'Wireless Over-Ear Headphones', priceCents: 249900, stock: 8, category: 'audio', imageUrl: 'https://picsum.photos/seed/aud-1/800/800', sellerName: 'SoundWave Audio' },
  { id: 'per-3', title: 'Ergonomic Wireless Mouse', priceCents: 149900, salePriceCents: 119900, stock: 40, category: 'peripherals', imageUrl: 'https://picsum.photos/seed/per-3/800/800', sellerName: 'Peripia Tech' },
]

function toLines(items: CartInputBody['items']): CartLine[] {
  return items.map((i) => ({
    productId: i.productId,
    title: i.productId,
    priceCents: 100000,
    imageUrl: 'https://example.com/i.webp',
    stock: 50,
    quantity: i.quantity,
  }))
}

export const handlers = [
  http.get('/api/health', () => HttpResponse.json({ status: 'ok' })),
  http.get('/api/products', () => HttpResponse.json({ items: SAMPLE_PRODUCTS, nextPage: null })),
  http.get('/api/products/:id', ({ params }) => {
    const product = SAMPLE_PRODUCTS.find((p) => p.id === params.id)
    return product ? HttpResponse.json({ product }) : new HttpResponse(null, { status: 404 })
  }),
  http.get('/api/categories', () => HttpResponse.json({ categories: CATEGORIES })),
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
    mswCart = toLines(body.items)
    return HttpResponse.json({ items: mswCart })
  }),
  http.post('/api/cart/merge', async ({ request }) => {
    const body = (await request.json()) as CartInputBody
    mswCart = [...mswCart, ...toLines(body.items)]
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
