import { z } from 'zod'

export const sellerProductInputSchema = z.object({
  title: z.string().min(2),
  category: z.string().min(2),
  description: z.string().optional(),
  priceCents: z.number().int().positive(),
  stock: z.number().int().nonnegative(),
  imageUrl: z.url().optional(), // client sends none; the store defaults a placeholder
  status: z.enum(['active', 'draft']).default('active'),
})

export const sellerProductSchema = sellerProductInputSchema.extend({
  imageUrl: z.url(),
  id: z.string().min(1),
  sellerUid: z.string().min(1),
})

export type SellerProductInput = z.infer<typeof sellerProductInputSchema>
export type SellerProduct = z.infer<typeof sellerProductSchema>
