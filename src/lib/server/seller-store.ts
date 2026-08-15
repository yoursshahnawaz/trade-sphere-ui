import type { SellerProduct, SellerProductInput } from '@/lib/schemas/seller-product-schema'
import { getDb } from './supabase'
import type { ProductRow } from './db-types'

const img = (seed: string): string => `https://picsum.photos/seed/${seed}/600/600`

function toSellerProduct(r: ProductRow): SellerProduct {
  const p: SellerProduct = {
    id: r.id,
    sellerUid: r.seller_uid,
    title: r.title,
    category: r.category,
    priceCents: r.price_cents,
    stock: r.stock,
    imageUrl: r.image_url,
    status: r.status,
  }
  if (r.sale_price_cents != null) p.salePriceCents = r.sale_price_cents
  return p
}

export async function listSellerProducts(uid: string): Promise<SellerProduct[]> {
  const { data } = await getDb()
    .from('products')
    .select('*')
    .eq('seller_uid', uid)
    .order('created_at', { ascending: false })
  return ((data ?? []) as ProductRow[]).map(toSellerProduct)
}

export async function getSellerProduct(uid: string, id: string): Promise<SellerProduct | undefined> {
  const { data } = await getDb().from('products').select('*').eq('id', id).eq('seller_uid', uid).maybeSingle()
  const row = data as ProductRow | null
  return row ? toSellerProduct(row) : undefined
}

export async function addSellerProduct(uid: string, input: SellerProductInput): Promise<SellerProduct> {
  const id = crypto.randomUUID()
  const row = {
    id,
    seller_uid: uid,
    title: input.title,
    category: input.category,
    price_cents: input.priceCents,
    sale_price_cents: input.salePriceCents ?? null,
    stock: input.stock,
    image_url: input.imageUrl ?? img(id),
    status: input.status,
  }
  const { data, error } = await getDb().from('products').insert(row).select('*').single()
  if (error) throw new Error(error.message)
  return toSellerProduct(data as ProductRow)
}

export async function updateSellerProduct(
  uid: string,
  id: string,
  patch: Partial<Omit<SellerProduct, 'id' | 'sellerUid'>>,
): Promise<SellerProduct | undefined> {
  const dbPatch: Record<string, unknown> = {}
  if (patch.title !== undefined) dbPatch.title = patch.title
  if (patch.category !== undefined) dbPatch.category = patch.category
  if (patch.priceCents !== undefined) dbPatch.price_cents = patch.priceCents
  if ('salePriceCents' in patch) dbPatch.sale_price_cents = patch.salePriceCents ?? null
  if (patch.stock !== undefined) dbPatch.stock = patch.stock
  if (patch.imageUrl !== undefined) dbPatch.image_url = patch.imageUrl
  if (patch.status !== undefined) dbPatch.status = patch.status

  const { data } = await getDb()
    .from('products')
    .update(dbPatch)
    .eq('id', id)
    .eq('seller_uid', uid)
    .select('*')
    .maybeSingle()
  const row = data as ProductRow | null
  return row ? toSellerProduct(row) : undefined
}

export async function removeSellerProduct(uid: string, id: string): Promise<boolean> {
  const { data } = await getDb().from('products').delete().eq('id', id).eq('seller_uid', uid).select('id')
  return ((data ?? []) as unknown[]).length > 0
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export interface SellerAnalytics {
  kpis: { totalSalesCents: number; traffic: number }
  revenueSeries: { month: string; revenue: number }[]
  topProducts: { title: string; units: number }[]
}

export async function getSellerAnalytics(uid: string): Promise<SellerAnalytics> {
  const seed = hash(uid)
  const revenueSeries = MONTHS.map((month, i) => ({
    month,
    revenue: 400000 + ((seed + i * 97733) % 900000) + i * 35000,
  }))
  const totalSalesCents = revenueSeries.reduce((n, m) => n + m.revenue, 0)
  const products = await listSellerProducts(uid)
  const topProducts = products
    .map((p) => ({ title: p.title, units: 20 + (hash(p.id) % 480) }))
    .sort((a, b) => b.units - a.units)
    .slice(0, 5)
  return { kpis: { totalSalesCents, traffic: 1800 + (seed % 6000) }, revenueSeries, topProducts }
}
