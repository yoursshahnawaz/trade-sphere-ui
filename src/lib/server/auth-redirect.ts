export type AuthDecision = { type: 'next' } | { type: 'redirect'; to: string }

// Public routes that live under a protected prefix and must bypass the guard.
const PUBLIC_WITHIN_PROTECTED = ['/seller/register']

function loginRedirect(pathname: string, search: string): AuthDecision {
  return { type: 'redirect', to: `/login?returnUrl=${encodeURIComponent(pathname + search)}` }
}

export function decideAuth(
  pathname: string,
  search: string,
  session: { role: string } | null,
): AuthDecision {
  if (PUBLIC_WITHIN_PROTECTED.includes(pathname)) return { type: 'next' }

  const role = session?.role
  const isSellerArea = pathname.startsWith('/seller')
  const isBuyerAuth = pathname === '/checkout' || pathname.startsWith('/orders')
  const isPublicShopping = pathname === '/' || pathname.startsWith('/products')

  // Seller portal: sellers only.
  if (isSellerArea) {
    if (!session) return loginRedirect(pathname, search)
    if (role !== 'seller') return { type: 'redirect', to: '/' }
    return { type: 'next' }
  }

  // A seller account is not a buyer — keep them out of the shopping experience.
  if (role === 'seller' && (isPublicShopping || isBuyerAuth)) {
    return { type: 'redirect', to: '/seller' }
  }

  // Buyer routes that require a session.
  if (isBuyerAuth && !session) return loginRedirect(pathname, search)

  return { type: 'next' }
}
