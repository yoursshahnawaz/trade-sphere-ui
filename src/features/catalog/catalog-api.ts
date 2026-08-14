import { productPageSchema, type ProductPage } from '@/lib/schemas/product-query-schema'

export interface CatalogFilters {
  q: string
  category: string | null
  minPrice: number | null
  maxPrice: number | null
  inStock: boolean
}

export async function fetchProducts(
  filters: CatalogFilters,
  pageParam: number,
  signal: AbortSignal,
): Promise<ProductPage> {
  const sp = new URLSearchParams()
  sp.set('page', String(pageParam))
  if (filters.q) sp.set('q', filters.q)
  if (filters.category) sp.set('category', filters.category)
  if (filters.minPrice != null) sp.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice != null) sp.set('maxPrice', String(filters.maxPrice))
  if (filters.inStock) sp.set('inStock', 'true')

  const res = await fetch(`/api/products?${sp.toString()}`, { signal })
  if (!res.ok) throw new Error('Failed to load products')
  return productPageSchema.parse(await res.json())
}
