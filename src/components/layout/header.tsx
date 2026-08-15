'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { loggedOut } from '@/features/auth/auth-slice'
import { authClient } from '@/features/auth/auth-client'
import { selectCartCount } from '@/features/cart/cart-slice'
import { setCartDrawerOpen } from '@/store/ui-slice'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

export function Header(): ReactNode {
  const { status, user } = useAppSelector((s) => s.auth)
  const cartCount = useAppSelector(selectCartCount)
  const dispatch = useAppDispatch()
  const router = useRouter()

  async function handleLogout(): Promise<void> {
    await authClient.logout()
    dispatch(loggedOut())
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold">
          Trade-Sphere
        </Link>
        <nav className="flex items-center gap-2">
          <button
            type="button"
            aria-label={`Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
            onClick={() => dispatch(setCartDrawerOpen(true))}
            className="relative rounded-md p-2 text-foreground/80 hover:bg-accent hover:text-foreground"
          >
            <ShoppingCart className="size-5" />
            {cartCount > 0 && (
              <span
                aria-live="polite"
                className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground"
              >
                {cartCount}
              </span>
            )}
          </button>

          {status === 'authenticated' && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent">
                {user.email ?? 'Account'}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{user.email ?? 'Signed in'}</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/orders')}>My orders</DropdownMenuItem>
                {user.role === 'seller' && (
                  <DropdownMenuItem onClick={() => router.push('/seller')}>
                    Seller dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login" className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
