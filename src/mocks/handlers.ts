import { http, HttpResponse } from 'msw'
import { normalizeInputs } from '@/lib/server/cart-store'
import { mergeCarts } from '@/features/cart/cart-merge'
import type { CartLine } from '@/types'

type CartInputBody = { items: { productId: string; quantity: number }[] }
let mswCart: CartLine[] = []

export const handlers = [
  http.get('/api/health', () => HttpResponse.json({ status: 'ok' })),
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
