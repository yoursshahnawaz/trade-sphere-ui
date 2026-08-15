'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useAppSelector } from '@/store/hooks'

interface FooterLink {
  href: string
  label: string
}

const SHOP: FooterLink[] = [
  { href: '/products', label: 'All products' },
  { href: '/offers', label: 'Offers' },
]
const SELLER: FooterLink[] = [
  { href: '/seller', label: 'Dashboard' },
  { href: '/seller/inventory', label: 'Inventory' },
  { href: '/seller/orders', label: 'Orders' },
  { href: '/seller/products/new', label: 'Add product' },
]

function LinkColumn({ label, links }: { label: string; links: FooterLink[] }): ReactNode {
  return (
    <nav aria-label={label} className="text-sm">
      <p className="mb-2 font-medium">{label}</p>
      <ul className="space-y-1.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function Footer(): ReactNode {
  const { status, user } = useAppSelector((s) => s.auth)
  const isSeller = status === 'authenticated' && user?.role === 'seller'
  const isBuyer = status === 'authenticated' && user?.role === 'buyer'

  // Sellers get their portal links; buyers/guests get shopping links.
  const primary = isSeller ? { label: 'Seller', links: SELLER } : { label: 'Shop', links: SHOP }
  const account: FooterLink[] = isSeller
    ? [{ href: '/account', label: 'My profile' }]
    : isBuyer
      ? [
          { href: '/orders', label: 'My orders' },
          { href: '/account', label: 'My account' },
        ]
      : [
          { href: '/login', label: 'Log in' },
          { href: '/register', label: 'Create account' },
          { href: '/seller/register', label: 'Sell on Trade-Sphere' },
        ]

  return (
    <footer className="mt-12 border-t bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="font-display text-lg font-semibold tracking-tight">Trade-Sphere</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            India&apos;s warm little marketplace — shop across sellers, or open your own storefront.
          </p>
        </div>
        <LinkColumn label={primary.label} links={primary.links} />
        <LinkColumn label="Account" links={account} />
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground">
          © 2026 Trade-Sphere.
        </p>
      </div>
    </footer>
  )
}
