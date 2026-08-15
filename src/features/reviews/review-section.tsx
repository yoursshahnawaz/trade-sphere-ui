import type { ReactNode } from 'react'
import Link from 'next/link'
import { MessageSquareText } from 'lucide-react'
import type { Review, RatingSummary } from '@/lib/schemas/review-schema'
import { StarRating } from './star-rating'
import { ReviewForm } from './review-form'

export interface ReviewSectionProps {
  productId: string
  reviews: Review[]
  summary: RatingSummary
  viewer: 'buyer' | 'seller' | 'guest'
  returnUrl: string
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ReviewSection({
  productId,
  reviews,
  summary,
  viewer,
  returnUrl,
}: ReviewSectionProps): ReactNode {
  return (
    <section aria-labelledby="reviews-heading" className="mx-auto mt-12 max-w-5xl">
      <h2 id="reviews-heading" className="font-display text-xl font-semibold tracking-tight">
        Ratings &amp; reviews
      </h2>

      <div className="mt-2 flex items-center gap-3">
        {summary.count > 0 ? (
          <>
            <span className="text-3xl font-bold tabular-nums">{summary.average.toFixed(1)}</span>
            <div>
              <StarRating average={summary.average} size="md" showLabel={false} />
              <p className="text-xs text-muted-foreground">
                {summary.count} review{summary.count === 1 ? '' : 's'}
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No reviews yet — be the first to share your thoughts.</p>
        )}
      </div>

      <div className="mt-5">
        {viewer === 'buyer' && <ReviewForm productId={productId} />}
        {viewer === 'guest' && (
          <p className="rounded-xl border border-dashed bg-card p-4 text-sm text-muted-foreground">
            <Link
              href={`/login?returnUrl=${encodeURIComponent(returnUrl)}`}
              className="font-medium text-primary hover:underline"
            >
              Log in
            </Link>{' '}
            to write a review.
          </p>
        )}
      </div>

      {reviews.length > 0 && (
        <ul className="mt-6 space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{r.authorName}</p>
                <time dateTime={r.createdAt} className="text-xs text-muted-foreground">
                  {formatDate(r.createdAt)}
                </time>
              </div>
              <StarRating average={r.rating} size="sm" className="mt-1" />
              {r.body && <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>}
            </li>
          ))}
        </ul>
      )}

      {reviews.length === 0 && summary.count === 0 && viewer === 'seller' && (
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquareText className="size-4" /> Reviews from buyers will appear here.
        </p>
      )}
    </section>
  )
}
