import { z } from 'zod'

export const sellerProductInputSchema = z.object({
  title: z.string().min(2),
  category: z.string().min(2),
  description: z.string().optional(),
  priceCents: z.number().int().positive(),
  salePriceCents: z.number().int().positive().optional(), // an optional "offer" (must be < priceCents)
  stock: z.number().int().nonnegative(),
  imageUrl: z.url().optional(), // onboarding sends none; the store defaults a placeholder
  status: z.enum(['active', 'draft']).default('active'),
})

export const sellerProductSchema = sellerProductInputSchema.extend({
  imageUrl: z.url(),
  id: z.string().min(1),
  sellerUid: z.string().min(1),
})

// Partial update: every field optional, no status default (a stock-only PATCH must
// not flip a draft to active). `salePriceCents: null` clears an existing offer.
export const sellerProductPatchSchema = z.object({
  title: z.string().min(2).optional(),
  category: z.string().min(2).optional(),
  description: z.string().optional(),
  priceCents: z.number().int().positive().optional(),
  salePriceCents: z.number().int().positive().nullable().optional(),
  stock: z.number().int().nonnegative().optional(),
  imageUrl: z.url().optional(),
  status: z.enum(['active', 'draft']).optional(),
})

export type SellerProductInput = z.infer<typeof sellerProductInputSchema>
export type SellerProduct = z.infer<typeof sellerProductSchema>
export type SellerProductPatch = z.infer<typeof sellerProductPatchSchema>
