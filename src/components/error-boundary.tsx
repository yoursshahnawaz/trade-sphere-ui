'use client'

import type { ComponentType, ReactNode } from 'react'
import {
  ErrorBoundary as ReactErrorBoundary,
  type FallbackProps,
} from 'react-error-boundary'

function DefaultFallback({ error, resetErrorBoundary }: FallbackProps): ReactNode {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm"
    >
      <p className="font-medium">Something went wrong.</p>
      <p className="text-muted-foreground">
        {error instanceof Error ? error.message : String(error)}
      </p>
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground"
      >
        Retry
      </button>
    </div>
  )
}

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ComponentType<FallbackProps>
}

export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps): ReactNode {
  return (
    <ReactErrorBoundary FallbackComponent={fallback ?? DefaultFallback}>
      {children}
    </ReactErrorBoundary>
  )
}
