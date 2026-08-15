import type { ReactNode } from 'react'
import { SellerNav } from '@/features/seller/seller-nav'

// Route group: this layout wraps the seller portal pages only. The public
// /seller/register page lives outside the group, so it shows no portal nav.
export default function SellerPortalLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <div>
      <SellerNav />
      {children}
    </div>
  )
}
