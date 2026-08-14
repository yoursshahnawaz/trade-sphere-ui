import { z } from 'zod'

export const productSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  priceCents: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative(),
  category: z.string().min(1),
  imageUrl: z.url(),
})

export type Product = z.infer<typeof productSchema>
