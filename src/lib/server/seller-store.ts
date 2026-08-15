import type { SellerProduct, SellerProductInput } from '@/lib/schemas/seller-product-schema'

const img = (seed: string): string => `https://picsum.photos/seed/${seed}/600/600`

// Deterministic per-seller seed so the dashboard/table are populated on first visit.
// Stock/status values are chosen to surface every status badge (In/Low/Out/Draft).
const SEED: Omit<SellerProduct, 'sellerUid' | 'id'>[] = [
  { title: 'Wireless Earbuds Pro', category: 'audio', priceCents: 7999, stock: 24, imageUrl: img('sp1'), status: 'active' },
  { title: 'Ergonomic Mouse', category: 'peripherals', priceCents: 3499, stock: 3, imageUrl: img('sp2'), status: 'active' },
  { title: 'Fitness Band', category: 'wearables', priceCents: 5999, salePriceCents: 4499, stock: 40, imageUrl: img('sp3'), status: 'active' },
  { title: 'Smart Plug', category: 'home', priceCents: 1999, stock: 0, imageUrl: img('sp4'), status: 'active' },
  { title: 'Gaming Headset', category: 'gaming', priceCents: 8999, stock: 12, imageUrl: img('sp5'), status: 'active' },
  { title: 'Studio Microphone', category: 'audio', priceCents: 12999, stock: 7, imageUrl: img('sp6'), status: 'draft' },
]

// Shared via globalThis so the dashboard server component AND the product routes
// read the same in-memory store in dev, where module state isn't shared.
const globalForSeller = globalThis as unknown as { __sellerStore?: Map<string, SellerProduct[]> }
const store = globalForSeller.__sellerStore ?? (globalForSeller.__sellerStore = new Map<string, SellerProduct[]>())

export function listSellerProducts(uid: string): SellerProduct[] {
  let products = store.get(uid)
  if (!products) {
    // Ids are prefixed with the uid so products are unique across sellers in the
    // unified buyer catalog.
    products = SEED.map((s, i) => ({ ...s, id: `${uid}-sp${i + 1}`, sellerUid: uid }))
    store.set(uid, products)
  }
  return products
}

export function addSellerProduct(uid: string, input: SellerProductInput): SellerProduct {
  const products = listSellerProducts(uid) // ensures the seller is seeded first
  const id = crypto.randomUUID()
  const product: SellerProduct = {
    ...input,
    id,
    sellerUid: uid,
    imageUrl: input.imageUrl ?? img(id), // never trust a client blob: URL
  }
  products.push(product)
  return product
}

export function getSellerProduct(uid: string, id: string): SellerProduct | undefined {
  return listSellerProducts(uid).find((p) => p.id === id)
}

export function updateSellerProduct(
  uid: string,
  id: string,
  patch: Partial<Omit<SellerProduct, 'id' | 'sellerUid'>>,
): SellerProduct | undefined {
  const products = listSellerProducts(uid)
  const idx = products.findIndex((p) => p.id === id)
  if (idx < 0) return undefined
  const updated: SellerProduct = { ...products[idx]!, ...patch }
  products[idx] = updated
  return updated
}

export function removeSellerProduct(uid: string, id: string): boolean {
  const products = listSellerProducts(uid)
  const idx = products.findIndex((p) => p.id === id)
  if (idx < 0) return false
  products.splice(idx, 1)
  return true
}

/** All sellers' products (used to feed the unified buyer catalog). */
export function listAllSellerProducts(): SellerProduct[] {
  return [...store.values()].flat()
}

export function findSellerProductById(id: string): SellerProduct | undefined {
  for (const products of store.values()) {
    const found = products.find((p) => p.id === id)
    if (found) return found
  }
  return undefined
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

// FNV-1a — stable pseudo-value from a string (no Math.random / Date, so tests are deterministic).
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
  revenueSeries: { month: string; revenue: number }[] // revenue in cents
  topProducts: { title: string; units: number }[]
}

export function getSellerAnalytics(uid: string): SellerAnalytics {
  const seed = hash(uid)
  const revenueSeries = MONTHS.map((month, i) => ({
    month,
    revenue: 400000 + ((seed + i * 97733) % 900000) + i * 35000, // deterministic, gently trending
  }))
  const totalSalesCents = revenueSeries.reduce((n, m) => n + m.revenue, 0)
  const topProducts = listSellerProducts(uid)
    .map((p) => ({ title: p.title, units: 20 + (hash(p.id) % 480) }))
    .sort((a, b) => b.units - a.units)
    .slice(0, 5)
  return { kpis: { totalSalesCents, traffic: 1800 + (seed % 6000) }, revenueSeries, topProducts }
}
