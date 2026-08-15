'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/seller', label: 'Dashboard' },
  { href: '/seller/inventory', label: 'Inventory' },
  { href: '/seller/products/new', label: 'Add product' },
] as const

export function SellerNav(): ReactNode {
  const pathname = usePathname()
  return (
    <nav aria-label="Seller portal" className="border-b">
      <ul className="mx-auto flex max-w-6xl gap-1 px-4">
        {LINKS.map((l) => {
          const active = pathname === l.href
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-block border-b-2 px-3 py-3 text-sm font-medium',
                  active
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {l.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
