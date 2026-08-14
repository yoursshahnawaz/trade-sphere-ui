export type PromoAudience = 'all' | 'guest' | 'auth' | 'first-visit'

export interface Promo {
  id: string
  title: string
  subtitle: string
  href: string
  img: string
  audience: PromoAudience
}

// Index 0 is a stable, audience-agnostic hero (its image is the preloaded LCP
// element); targeting only affects the slides after it.
export const promos: Promo[] = [
  {
    id: 'hero',
    title: 'Summer Tech Sale',
    subtitle: 'Up to 30% off top gear',
    href: '/?category=audio',
    img: 'https://picsum.photos/seed/promo-hero/1600/600',
    audience: 'all',
  },
  {
    id: 'welcome',
    title: 'Welcome — 10% off your first order',
    subtitle: 'New here? Use code HELLO10',
    href: '/register',
    img: 'https://picsum.photos/seed/promo-welcome/1600/600',
    audience: 'first-visit',
  },
  {
    id: 'guest',
    title: 'Sign in for member prices',
    subtitle: 'Exclusive deals for members',
    href: '/login',
    img: 'https://picsum.photos/seed/promo-guest/1600/600',
    audience: 'guest',
  },
  {
    id: 'member',
    title: 'Your member deals',
    subtitle: 'Handpicked for you',
    href: '/?category=gaming',
    img: 'https://picsum.photos/seed/promo-member/1600/600',
    audience: 'auth',
  },
  {
    id: 'wearables',
    title: 'New wearables',
    subtitle: 'Track more, do more',
    href: '/?category=wearables',
    img: 'https://picsum.photos/seed/promo-wear/1600/600',
    audience: 'all',
  },
]
