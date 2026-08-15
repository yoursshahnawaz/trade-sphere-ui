import type { ReactNode } from 'react'
import Link from 'next/link'

const SHOP = [
  { href: '/', label: 'All products' },
  { href: '/offers', label: 'Offers' },
  { href: '/orders', label: 'My orders' },
  { href: '/account', label: 'My account' },
]
const SELL = [
  { href: '/seller/register', label: 'Start selling' },
  { href: '/seller', label: 'Seller dashboard' },
]

export function Footer(): ReactNode {
  return (
    <footer className="mt-12 border-t bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="font-display text-lg font-semibold tracking-tight">Trade-Sphere</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            India&apos;s warm little marketplace — shop across sellers, or open your own storefront.
          </p>
        </div>
        <nav aria-label="Shop" className="text-sm">
          <p className="mb-2 font-medium">Shop</p>
          <ul className="space-y-1.5">
            {SHOP.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-muted-foreground transition-colors hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Sell" className="text-sm">
          <p className="mb-2 font-medium">Sell</p>
          <ul className="space-y-1.5">
            {SELL.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-muted-foreground transition-colors hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground">
          © {2026} Trade-Sphere. Prices in ₹, inclusive of applicable taxes.
        </p>
      </div>
    </footer>
  )
}
