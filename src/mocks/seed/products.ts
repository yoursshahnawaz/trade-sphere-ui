import type { Product } from '@/types'

const CATEGORIES = ['audio', 'peripherals', 'wearables', 'home', 'gaming'] as const
const ADJECTIVES = ['Pro', 'Lite', 'Max', 'Mini', 'Ultra', 'Studio', 'Elite']
const NOUNS: Record<(typeof CATEGORIES)[number], string> = {
  audio: 'Headphones',
  peripherals: 'Keyboard',
  wearables: 'Smartwatch',
  home: 'Desk Lamp',
  gaming: 'Controller',
}

// p1/p2 are test-load-bearing (cart-store.test) — keep their exact values.
const base: Product[] = [
  {
    id: 'p1',
    title: 'Wireless Over-Ear Headphones',
    priceCents: 12999,
    stock: 8,
    category: 'audio',
    imageUrl: 'https://picsum.photos/seed/p1/800/800',
    options: [{ name: 'Color', values: ['Black', 'Silver', 'Navy'] }],
  },
  {
    id: 'p2',
    title: 'Mechanical Keyboard',
    priceCents: 8999,
    stock: 0,
    category: 'peripherals',
    imageUrl: 'https://picsum.photos/seed/p2/800/800',
  },
  {
    id: 'p3',
    title: '4K Webcam',
    priceCents: 6499,
    stock: 3,
    category: 'peripherals',
    imageUrl: 'https://picsum.photos/seed/p3/800/800',
  },
]

// Deterministic generator (no Math.random) — p4..p36.
const generated: Product[] = Array.from({ length: 33 }, (_, k) => {
  const i = k + 4
  const category = CATEGORIES[i % CATEGORIES.length]!
  const adjective = ADJECTIVES[i % ADJECTIVES.length]!
  const product: Product = {
    id: `p${i}`,
    title: `${adjective} ${NOUNS[category]}`,
    priceCents: 1499 + ((i * 613) % 18000),
    stock: (i * 5) % 11, // yields a few 0-stock products (p11, p22, p33)
    category,
    imageUrl: `https://picsum.photos/seed/p${i}/800/800`,
  }
  if (i % 6 === 0) product.options = [{ name: 'Size', values: ['S', 'M', 'L'] }]
  return product
})

export const seedProducts: Product[] = [...base, ...generated]
