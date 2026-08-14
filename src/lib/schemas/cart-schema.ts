import { z } from 'zod'

export const cartLineSchema = z.object({
  productId: z.string().min(1),
  title: z.string().min(1),
  priceCents: z.number().int().nonnegative(),
  imageUrl: z.url(),
  stock: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
})
export const cartLinesSchema = z.array(cartLineSchema)

// What the client is allowed to assert; the server re-derives the rest from seed.
export const cartInputSchema = z.array(
  z.object({ productId: z.string().min(1), quantity: z.number().int().positive() }),
)

export type CartLine = z.infer<typeof cartLineSchema>
export type CartInput = z.infer<typeof cartInputSchema>
