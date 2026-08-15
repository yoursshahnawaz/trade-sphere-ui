'use client'

import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { reviewInputSchema, type ReviewInput } from '@/lib/schemas/review-schema'

export function ReviewForm({ productId }: { productId: string }): ReactNode {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReviewInput>({
    resolver: zodResolver(reviewInputSchema),
    defaultValues: { rating: 0, body: '' },
  })

  function choose(n: number): void {
    setRating(n)
    setValue('rating', n, { shouldValidate: true })
  }

  async function onSubmit(input: ReviewInput): Promise<void> {
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error('request failed')
      toast.success('Thanks for your review!')
      reset({ rating: 0, body: '' })
      setRating(0)
      router.refresh() // re-render the server-side list with the new review
    } catch {
      toast.error('Could not submit your review.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-xl border bg-card p-4" noValidate>
      <p className="font-medium">Write a review</p>
      <input type="hidden" {...register('rating')} />
      <div>
        <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Your rating">
          {Array.from({ length: 5 }, (_, i) => {
            const n = i + 1
            const active = (hover || rating) >= n
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n === 1 ? '' : 's'}`}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onFocus={() => setHover(n)}
                onBlur={() => setHover(0)}
                onClick={() => choose(n)}
                className="rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Star
                  className={cn(
                    'size-7 transition-colors',
                    active ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground/30',
                  )}
                />
              </button>
            )
          })}
        </div>
        {errors.rating && <p className="mt-1 text-xs text-destructive">Please choose a star rating.</p>}
      </div>
      <div>
        <label htmlFor="review-body" className="sr-only">
          Your review
        </label>
        <textarea
          id="review-body"
          {...register('body')}
          rows={3}
          placeholder="Share what you liked (or didn't)…"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {errors.body && <p className="mt-1 text-xs text-destructive">{errors.body.message}</p>}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
      >
        {isSubmitting ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  )
}
