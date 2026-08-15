import type { ReactNode } from 'react'
import { CheckoutWizard } from '@/features/checkout/checkout-wizard'

// Route is proxy-protected (auth required); the wizard handles the empty-cart case.
export default function CheckoutPage(): ReactNode {
  return <CheckoutWizard />
}
