import { z } from 'zod'
import { sellerProductSchema, type SellerProduct, type SellerProductInput } from '@/lib/schemas/seller-product-schema'

const productsResponse = z.object({ products: z.array(sellerProductSchema) })

export async function fetchSellerProducts(signal?: AbortSignal): Promise<SellerProduct[]> {
  const res = await fetch('/api/seller/products', signal ? { signal } : undefined)
  if (!res.ok) throw new Error('Failed to load products')
  return productsResponse.parse(await res.json()).products
}

export async function createSellerProduct(input: SellerProductInput): Promise<SellerProduct> {
  const res = await fetch('/api/seller/products', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('Failed to create product')
  const body = (await res.json()) as { product: unknown }
  return sellerProductSchema.parse(body.product)
}
