import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Compass } from 'lucide-react'

export const metadata: Metadata = { title: 'Page not found' }

export default function NotFound(): ReactNode {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
        <Compass className="size-8" />
      </span>
      <p className="mt-5 font-display text-6xl font-bold tracking-tight">404</p>
      <h1 className="mt-2 text-xl font-semibold">This page wandered off</h1>
      <p className="mt-2 text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back to the bazaar.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm"
        >
          Back to shop
        </Link>
        <Link href="/offers" className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">
          Browse offers
        </Link>
      </div>
    </div>
  )
}
