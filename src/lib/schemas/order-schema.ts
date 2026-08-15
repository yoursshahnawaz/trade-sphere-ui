import { z } from 'zod'
import { cartLineSchema } from './cart-schema'
import { addressSchema } from './address-schema'
import { paymentStoredSchema } from './payment-schema'

export const orderTotalsSchema = z.object({
  subtotalCents: z.number().int().nonnegative(),
  taxCents: z.number().int().nonnegative(),
  shippingCents: z.number().int().nonnegative(),
  totalCents: z.number().int().nonnegative(),
})

// The client only sends addresses + stored-payment; items/totals are server-derived.
export const orderInputSchema = z.object({
  shipping: addressSchema,
  billing: addressSchema,
  payment: paymentStoredSchema,
})
export type OrderInput = z.infer<typeof orderInputSchema>

export const orderSchema = z.object({
  id: z.string(),
  items: z.array(cartLineSchema),
  shipping: addressSchema,
  billing: addressSchema,
  payment: paymentStoredSchema,
  totals: orderTotalsSchema,
  createdAt: z.string(),
})
export type Order = z.infer<typeof orderSchema>
