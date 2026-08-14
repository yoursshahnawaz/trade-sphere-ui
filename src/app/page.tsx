import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

export default function HomePage(): ReactNode {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">Trade-Sphere</h1>
      <p className="text-muted-foreground">
        Foundation is up. Buyer and seller experiences arrive in later phases.
      </p>
      <Button>Get started</Button>
    </main>
  )
}
