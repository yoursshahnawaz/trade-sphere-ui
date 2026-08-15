import type { Product } from '@/types'
import type { ProductQuery, ProductPage } from '@/lib/schemas/product-query-schema'
import type { SellerProduct } from '@/lib/schemas/seller-product-schema'
import { seedProducts } from '@/mocks/seed/products'
import { listAllSellerProducts, findSellerProductById } from './seller-store'

function sellerToProduct(s: SellerProduct): Product {
  const p: Product = {
    id: s.id,
    title: s.title,
    priceCents: s.priceCents,
    stock: s.stock,
    category: s.category,
    imageUrl: s.imageUrl,
  }
  if (s.salePriceCents != null) p.salePriceCents = s.salePriceCents
  return p
}

// Unified marketplace catalog = the base seed (representing other sellers) plus
// every seller's ACTIVE products. Drafts never reach the buyer.
function catalog(): Product[] {
  const sellerActive = listAllSellerProducts()
    .filter((p) => p.status === 'active')
    .map(sellerToProduct)
  return [...seedProducts, ...sellerActive]
}

export function queryProducts(params: ProductQuery): ProductPage {
  const { page, limit, q, category, minPrice, maxPrice, inStock } = params
  let items = catalog()
  if (q) {
    const needle = q.toLowerCase()
    items = items.filter((p) => p.title.toLowerCase().includes(needle))
  }
  if (category) items = items.filter((p) => p.category === category)
  if (minPrice != null) items = items.filter((p) => p.priceCents >= minPrice)
  if (maxPrice != null) items = items.filter((p) => p.priceCents <= maxPrice)
  if (inStock) items = items.filter((p) => p.stock > 0)

  const total = items.length
  const start = (page - 1) * limit
  const pageItems = items.slice(start, start + limit)
  const end = start + pageItems.length
  return { items: pageItems, nextPage: end < total ? page + 1 : null }
}

export function getProduct(id: string): Product | undefined {
  const seeded = seedProducts.find((p) => p.id === id)
  if (seeded) return seeded
  const s = findSellerProductById(id)
  return s && s.status === 'active' ? sellerToProduct(s) : undefined
}

export function listCategories(): string[] {
  return [...new Set(catalog().map((p) => p.category))]
}
