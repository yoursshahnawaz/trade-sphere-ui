import type { ReactNode } from 'react'

export interface FieldErrorProps {
  name: string
  message?: string
}

export function FieldError({ name, message }: FieldErrorProps): ReactNode {
  if (!message) return null
  return (
    <p id={`${name}-error`} role="alert" className="text-sm text-destructive">
      {message}
    </p>
  )
}
