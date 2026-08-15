import { z } from 'zod'

export const reviewSchema = z.object({
  id: z.string(),
  productId: z.string(),
  authorName: z.string(),
  rating: z.number().int().min(1).max(5),
  body: z.string(),
  createdAt: z.string(),
})
export type Review = z.infer<typeof reviewSchema>

// The client asserts only the rating and text; productId comes from the URL and
// the author identity from the session — never trusted from the body.
export const reviewInputSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().max(1000),
})
export type ReviewInput = z.infer<typeof reviewInputSchema>

export interface RatingSummary {
  average: number
  count: number
}
