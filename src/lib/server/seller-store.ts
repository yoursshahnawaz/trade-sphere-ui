import type { SellerProduct, SellerProductInput } from '@/lib/schemas/seller-product-schema'

const img = (seed: string): string => `https://picsum.photos/seed/${seed}/600/600`

// Deterministic per-seller seed so the dashboard/table are populated on first visit.
// Stock/status values are chosen to surface every status badge (In/Low/Out/Draft).
const SEED: Omit<SellerProduct, 'sellerUid'>[] = [
  { id: 'sp1', title: 'Wireless Earbuds Pro', category: 'audio', priceCents: 7999, stock: 24, imageUrl: img('sp1'), status: 'active' },
  { id: 'sp2', title: 'Ergonomic Mouse', category: 'peripherals', priceCents: 3499, stock: 3, imageUrl: img('sp2'), status: 'active' },
  { id: 'sp3', title: 'Fitness Band', category: 'wearables', priceCents: 5999, stock: 0, imageUrl: img('sp3'), status: 'active' },
  { id: 'sp4', title: 'Smart Plug', category: 'home', priceCents: 1999, stock: 58, imageUrl: img('sp4'), status: 'active' },
  { id: 'sp5', title: 'Gaming Headset', category: 'gaming', priceCents: 8999, stock: 12, imageUrl: img('sp5'), status: 'active' },
  { id: 'sp6', title: 'Studio Microphone', category: 'audio', priceCents: 12999, stock: 7, imageUrl: img('sp6'), status: 'draft' },
]

// Shared via globalThis so the dashboard server component AND the product route
// read the same in-memory store in dev, where module state isn't shared.
const globalForSeller = globalThis as unknown as { __sellerStore?: Map<string, SellerProduct[]> }
const store = globalForSeller.__sellerStore ?? (globalForSeller.__sellerStore = new Map<string, SellerProduct[]>())

export function listSellerProducts(uid: string): SellerProduct[] {
  let products = store.get(uid)
  if (!products) {
    products = SEED.map((s) => ({ ...s, sellerUid: uid }))
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
  kpis: { totalSalesCents: number; activeOrders: number; traffic: number }
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
  return {
    kpis: { totalSalesCents, activeOrders: 12 + (seed % 40), traffic: 1800 + (seed % 6000) },
    revenueSeries,
    topProducts,
  }
}
