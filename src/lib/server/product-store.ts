import type { Product } from '@/types'
import type { ProductQuery, ProductPage } from '@/lib/schemas/product-query-schema'
import { seedProducts } from '@/mocks/seed/products'

export function queryProducts(params: ProductQuery): ProductPage {
  const { page, limit, q, category, minPrice, maxPrice, inStock } = params
  let items = seedProducts
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
  return seedProducts.find((p) => p.id === id)
}

export function listCategories(): string[] {
  return [...new Set(seedProducts.map((p) => p.category))]
}
