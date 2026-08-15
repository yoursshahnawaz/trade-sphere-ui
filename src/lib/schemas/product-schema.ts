import { z } from 'zod'

export const productSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  priceCents: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative(),
  category: z.string().min(1),
  imageUrl: z.url(),
  salePriceCents: z.number().int().positive().optional(),
  options: z
    .array(z.object({ name: z.string().min(1), values: z.array(z.string().min(1)).min(1) }))
    .optional(),
})

export type Product = z.infer<typeof productSchema>
