import type { Product } from '@/types'
import { getSellerInfo } from '@/lib/server/sellers'

const CATEGORIES = ['audio', 'peripherals', 'wearables', 'home', 'gaming'] as const
type Category = (typeof CATEGORIES)[number]

const ADJECTIVES = ['Pro', 'Lite', 'Max', 'Mini', 'Ultra', 'Studio', 'Elite']
const NOUNS: Record<Category, string> = {
  audio: 'Headphones',
  peripherals: 'Keyboard',
  wearables: 'Smartwatch',
  home: 'Desk Lamp',
  gaming: 'Controller',
}
// Each category is sold by one demo storefront (see sellers.ts).
const SELLER_BY_CATEGORY: Record<Category, string> = {
  audio: 'seller-soundwave',
  peripherals: 'seller-peripia',
  wearables: 'seller-wearably',
  home: 'seller-homeglow',
  gaming: 'seller-playzone',
}
// Realistic INR floors (paise) per category so prices read right to an Indian buyer.
const PRICE_FLOOR: Record<Category, number> = {
  audio: 149900,
  peripherals: 89900,
  wearables: 199900,
  home: 49900,
  gaming: 129900,
}

function withSeller(p: Omit<Product, 'sellerName' | 'sellerLocation'> & { sellerUid: string }): Product {
  const info = getSellerInfo(p.sellerUid)
  return { ...p, sellerName: info.name, sellerLocation: info.location }
}

// p1/p2/p3 are test-load-bearing (stock/category/title). Prices are realistic INR.
const base: Product[] = [
  withSeller({
    id: 'p1',
    title: 'Wireless Over-Ear Headphones',
    priceCents: 249900,
    stock: 8,
    category: 'audio',
    sellerUid: SELLER_BY_CATEGORY.audio,
    imageUrl: 'https://picsum.photos/seed/p1/800/800',
    options: [{ name: 'Color', values: ['Black', 'Silver', 'Navy'] }],
  }),
  withSeller({
    id: 'p2',
    title: 'Mechanical Keyboard',
    priceCents: 499900,
    stock: 0,
    category: 'peripherals',
    sellerUid: SELLER_BY_CATEGORY.peripherals,
    imageUrl: 'https://picsum.photos/seed/p2/800/800',
  }),
  withSeller({
    id: 'p3',
    title: '4K Webcam',
    priceCents: 349900,
    stock: 3,
    category: 'peripherals',
    sellerUid: SELLER_BY_CATEGORY.peripherals,
    imageUrl: 'https://picsum.photos/seed/p3/800/800',
  }),
]

// Deterministic generator (no Math.random) — p4..p36.
const generated: Product[] = Array.from({ length: 33 }, (_, k) => {
  const i = k + 4
  const category = CATEGORIES[i % CATEGORIES.length]!
  const adjective = ADJECTIVES[i % ADJECTIVES.length]!
  const product = withSeller({
    id: `p${i}`,
    title: `${adjective} ${NOUNS[category]}`,
    priceCents: PRICE_FLOOR[category] + ((i * 6131) % 700000), // realistic INR spread
    stock: (i * 5) % 11, // yields a few 0-stock products (p11, p22, p33)
    category,
    sellerUid: SELLER_BY_CATEGORY[category],
    imageUrl: `https://picsum.photos/seed/p${i}/800/800`,
    ...(i % 6 === 0 ? { options: [{ name: 'Size', values: ['S', 'M', 'L'] }] } : {}),
  })
  return product
})

export const seedProducts: Product[] = [...base, ...generated]
