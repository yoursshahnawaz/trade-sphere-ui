export interface Offer {
  id: string
  title: string
  tagline: string
  description: string
  category: string // catalog category the offer curates
  badge: string
  img: string
}

export const OFFERS: Offer[] = [
  {
    id: 'summer-audio',
    title: 'Summer Audio Sale',
    tagline: 'Up to 30% off headphones & earbuds',
    description:
      'Beat the heat with cool sound. Handpicked audio gear from top storefronts on Trade-Sphere, discounted for a limited time. Free delivery on orders over ₹500.',
    category: 'audio',
    badge: 'Up to 30% off',
    img: 'https://picsum.photos/seed/promo-hero/1600/600',
  },
  {
    id: 'gaming-fest',
    title: 'Gaming Fest',
    tagline: 'Level up your setup',
    description:
      'Controllers, peripherals and more to power your next session — the best prices of the season across our gaming sellers.',
    category: 'gaming',
    badge: 'Best prices',
    img: 'https://picsum.photos/seed/promo-member/1600/600',
  },
  {
    id: 'new-wearables',
    title: 'New Wearables',
    tagline: 'Track more, do more',
    description:
      'Just-launched smartwatches and bands from Wearably and friends. Fresh arrivals, member-friendly pricing.',
    category: 'wearables',
    badge: 'Just launched',
    img: 'https://picsum.photos/seed/promo-wear/1600/600',
  },
]

export function getOffer(id: string): Offer | undefined {
  return OFFERS.find((o) => o.id === id)
}
