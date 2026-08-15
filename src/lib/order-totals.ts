export interface OrderTotals {
  subtotalCents: number
  taxCents: number
  shippingCents: number
  totalCents: number
}

const TAX_RATE = 0.18 // GST
const FREE_SHIPPING_THRESHOLD_CENTS = 50000 // ₹500
const FLAT_SHIPPING_CENTS = 4900 // ₹49

export function computeTotals(subtotalCents: number): OrderTotals {
  const taxCents = Math.round(subtotalCents * TAX_RATE)
  const shippingCents =
    subtotalCents === 0 ? 0 : subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS
  return { subtotalCents, taxCents, shippingCents, totalCents: subtotalCents + taxCents + shippingCents }
}
