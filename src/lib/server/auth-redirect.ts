export type AuthDecision = { type: 'next' } | { type: 'redirect'; to: string }

// Public routes that live under a protected prefix and must bypass the guard.
const PUBLIC_WITHIN_PROTECTED = ['/seller/register']

export function decideAuth(
  pathname: string,
  search: string,
  session: { role: string } | null,
): AuthDecision {
  if (PUBLIC_WITHIN_PROTECTED.includes(pathname)) return { type: 'next' }
  if (!session) {
    return { type: 'redirect', to: `/login?returnUrl=${encodeURIComponent(pathname + search)}` }
  }
  if (pathname.startsWith('/seller') && session.role !== 'seller') {
    return { type: 'redirect', to: '/' }
  }
  return { type: 'next' }
}
