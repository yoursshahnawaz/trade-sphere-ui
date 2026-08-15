import { z } from 'zod'
import {
  sellerProductSchema,
  type SellerProduct,
  type SellerProductInput,
  type SellerProductPatch,
} from '@/lib/schemas/seller-product-schema'

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

export async function fetchSellerProduct(id: string): Promise<SellerProduct> {
  const res = await fetch(`/api/seller/products/${id}`)
  if (!res.ok) throw new Error('Failed to load product')
  const body = (await res.json()) as { product: unknown }
  return sellerProductSchema.parse(body.product)
}

export async function updateSellerProduct(id: string, patch: SellerProductPatch): Promise<SellerProduct> {
  const res = await fetch(`/api/seller/products/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error('Failed to update product')
  const body = (await res.json()) as { product: unknown }
  return sellerProductSchema.parse(body.product)
}

export async function deleteSellerProduct(id: string): Promise<void> {
  const res = await fetch(`/api/seller/products/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete product')
}

export async function uploadProductImage(file: File): Promise<string> {
  const body = new FormData()
  body.append('file', file)
  const res = await fetch('/api/seller/upload', { method: 'POST', body })
  if (!res.ok) throw new Error('Failed to upload image')
  return ((await res.json()) as { url: string }).url
}
