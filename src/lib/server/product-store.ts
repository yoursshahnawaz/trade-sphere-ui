import type { Product } from '@/types'
import type { ProductQuery, ProductPage } from '@/lib/schemas/product-query-schema'
import { getDb } from './supabase'
import { getSellersMap, getSellerInfo, type SellerInfo } from './sellers'
import { getRatingsFor, getRatingSummary } from './review-store'
import type { RatingSummary } from '@/lib/schemas/review-schema'
import type { ProductRow } from './db-types'

function toProduct(r: ProductRow, sellers: Map<string, SellerInfo>, rating?: RatingSummary): Product {
  const info = sellers.get(r.seller_uid) ?? { name: 'Independent Seller', location: 'India' }
  const p: Product = {
    id: r.id,
    title: r.title,
    priceCents: r.price_cents,
    stock: r.stock,
    category: r.category,
    imageUrl: r.image_url,
    sellerUid: r.seller_uid,
    sellerName: info.name,
    sellerLocation: info.location,
  }
  if (r.sale_price_cents != null) p.salePriceCents = r.sale_price_cents
  if (rating && rating.count > 0) {
    p.ratingAverage = rating.average
    p.ratingCount = rating.count
  }
  return p
}

export async function queryProducts(params: ProductQuery): Promise<ProductPage> {
  const { page, limit, q, category, minPrice, maxPrice, inStock } = params
  let query = getDb().from('products').select('*', { count: 'exact' }).eq('status', 'active')
  if (q) query = query.ilike('title', `%${q}%`)
  if (category) query = query.eq('category', category)
  if (minPrice != null) query = query.gte('price_cents', minPrice)
  if (maxPrice != null) query = query.lte('price_cents', maxPrice)
  if (inStock) query = query.gt('stock', 0)

  const from = (page - 1) * limit
  const { data, count } = await query.order('created_at', { ascending: false }).range(from, from + limit - 1)
  const rows = (data ?? []) as ProductRow[]
  const sellers = await getSellersMap(rows.map((r) => r.seller_uid))
  const ratings = await getRatingsFor(rows.map((r) => r.id))
  const items = rows.map((r) => toProduct(r, sellers, ratings.get(r.id)))
  const total = count ?? 0
  return { items, nextPage: from + rows.length < total ? page + 1 : null }
}

export async function getProduct(id: string): Promise<Product | undefined> {
  const { data } = await getDb().from('products').select('*').eq('id', id).maybeSingle()
  const row = data as ProductRow | null
  if (!row || row.status !== 'active') return undefined
  const info = await getSellerInfo(row.seller_uid)
  const rating = await getRatingSummary(row.id)
  return toProduct(row, new Map([[row.seller_uid, info]]), rating)
}

export async function listCategories(): Promise<string[]> {
  const { data } = await getDb().from('products').select('category').eq('status', 'active')
  const rows = (data ?? []) as Array<Pick<ProductRow, 'category'>>
  return [...new Set(rows.map((r) => r.category))].sort()
}

// Curated rails for the home page.
export async function getOnSaleProducts(limit: number): Promise<Product[]> {
  const { data } = await getDb()
    .from('products')
    .select('*')
    .eq('status', 'active')
    .not('sale_price_cents', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit)
  const rows = (data ?? []) as ProductRow[]
  const [sellers, ratings] = await Promise.all([
    getSellersMap(rows.map((r) => r.seller_uid)),
    getRatingsFor(rows.map((r) => r.id)),
  ])
  return rows.map((r) => toProduct(r, sellers, ratings.get(r.id)))
}

export async function getTopRatedProducts(limit: number): Promise<Product[]> {
  const { data } = await getDb().from('products').select('*').eq('status', 'active')
  const rows = (data ?? []) as ProductRow[]
  const [sellers, ratings] = await Promise.all([
    getSellersMap(rows.map((r) => r.seller_uid)),
    getRatingsFor(rows.map((r) => r.id)),
  ])
  return rows
    .map((r) => toProduct(r, sellers, ratings.get(r.id)))
    .filter((p) => (p.ratingCount ?? 0) > 0)
    .sort((a, b) => (b.ratingAverage ?? 0) - (a.ratingAverage ?? 0))
    .slice(0, limit)
}
