import type { SellerProduct } from '@/lib/schemas/seller-product-schema'

export type ProductStatus = 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Draft'

/** Derive the badge label from a product's stock + publish state. */
export function productStatus(p: Pick<SellerProduct, 'stock' | 'status'>): ProductStatus {
  if (p.status === 'draft') return 'Draft'
  if (p.stock === 0) return 'Out of Stock'
  if (p.stock < 5) return 'Low Stock'
  return 'In Stock'
}
