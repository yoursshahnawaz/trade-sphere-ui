import { z } from 'zod'
import { productSchema } from './product-schema'

// Treat '' / null as absent so an empty price field never becomes a 0 filter.
const optionalInt = z.preprocess(
  (v) => (v === '' || v == null ? undefined : v),
  z.coerce.number().int().nonnegative().optional(),
)

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
  q: z.string().optional(),
  category: z.string().optional(),
  minPrice: optionalInt,
  maxPrice: optionalInt,
  inStock: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
})
export type ProductQuery = z.infer<typeof productQuerySchema>

export const productPageSchema = z.object({
  items: z.array(productSchema),
  nextPage: z.number().int().nullable(),
})
export type ProductPage = z.infer<typeof productPageSchema>
