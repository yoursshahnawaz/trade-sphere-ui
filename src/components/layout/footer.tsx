import type { ReactNode } from 'react'

export function Footer(): ReactNode {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground">
        Trade-Sphere — a demo multi-vendor marketplace.
      </div>
    </footer>
  )
}
