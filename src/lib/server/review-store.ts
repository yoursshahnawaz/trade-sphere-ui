import type { Review, ReviewInput, RatingSummary } from '@/lib/schemas/review-schema'
import { getDb } from './supabase'

interface ReviewRow {
  id: string
  product_id: string
  uid: string
  author_name: string
  rating: number
  body: string
  created_at: string
}

function toReview(r: ReviewRow): Review {
  return {
    id: r.id,
    productId: r.product_id,
    authorName: r.author_name,
    rating: r.rating,
    body: r.body,
    createdAt: r.created_at,
  }
}

// Pure aggregation, exported so it can be unit-tested without the DB.
export function summarize(ratings: number[]): RatingSummary {
  if (ratings.length === 0) return { average: 0, count: 0 }
  const sum = ratings.reduce((n, r) => n + r, 0)
  return { average: sum / ratings.length, count: ratings.length }
}

export async function listReviews(productId: string): Promise<Review[]> {
  const { data } = await getDb()
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
  return ((data ?? []) as ReviewRow[]).map(toReview)
}

export async function addReview(
  productId: string,
  uid: string,
  authorName: string,
  input: ReviewInput,
): Promise<Review> {
  // Upsert on (product_id, uid): re-reviewing updates the existing row.
  const { data } = await getDb()
    .from('reviews')
    .upsert(
      { product_id: productId, uid, author_name: authorName, rating: input.rating, body: input.body },
      { onConflict: 'product_id,uid' },
    )
    .select('*')
    .single()
  return toReview(data as ReviewRow)
}

export async function getRatingSummary(productId: string): Promise<RatingSummary> {
  const { data } = await getDb().from('reviews').select('rating').eq('product_id', productId)
  return summarize(((data ?? []) as Array<{ rating: number }>).map((r) => r.rating))
}

// Batch summaries for a catalog page so cards can show stars without N queries.
export async function getRatingsFor(productIds: string[]): Promise<Map<string, RatingSummary>> {
  const map = new Map<string, RatingSummary>()
  if (productIds.length === 0) return map
  const { data } = await getDb().from('reviews').select('product_id, rating').in('product_id', productIds)
  const byProduct = new Map<string, number[]>()
  for (const r of (data ?? []) as Array<{ product_id: string; rating: number }>) {
    const list = byProduct.get(r.product_id) ?? []
    list.push(r.rating)
    byProduct.set(r.product_id, list)
  }
  for (const [id, ratings] of byProduct) map.set(id, summarize(ratings))
  return map
}
