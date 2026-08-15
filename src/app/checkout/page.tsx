import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { CheckoutWizard } from '@/features/checkout/checkout-wizard'

export const metadata: Metadata = { title: 'Checkout' }

// Route is proxy-protected (auth required); the wizard handles the empty-cart case.
export default function CheckoutPage(): ReactNode {
  return (
    <>
      <h1 className="sr-only">Checkout</h1>
      <CheckoutWizard />
    </>
  )
}
