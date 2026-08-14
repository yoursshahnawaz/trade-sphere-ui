import type { Product } from '@/types'

export const seedProducts: Product[] = [
  {
    id: 'p1',
    title: 'Wireless Over-Ear Headphones',
    priceCents: 12999,
    stock: 8,
    category: 'audio',
    imageUrl: 'https://picsum.photos/seed/p1/600/600',
  },
  {
    id: 'p2',
    title: 'Mechanical Keyboard',
    priceCents: 8999,
    stock: 0,
    category: 'peripherals',
    imageUrl: 'https://picsum.photos/seed/p2/600/600',
  },
  {
    id: 'p3',
    title: '4K Webcam',
    priceCents: 6499,
    stock: 3,
    category: 'peripherals',
    imageUrl: 'https://picsum.photos/seed/p3/600/600',
  },
]
