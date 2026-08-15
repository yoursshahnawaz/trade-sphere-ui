'use client'

import type { ReactNode } from 'react'
import { DropzoneUpload } from './dropzone-upload'

export interface ImagesStepProps {
  onSubmit: (status: 'active' | 'draft') => void
  isSubmitting: boolean
}

export function ImagesStep({ onSubmit, isSubmitting }: ImagesStepProps): ReactNode {
  return (
    <div className="space-y-4">
      <DropzoneUpload />
      <p className="text-sm text-muted-foreground">
        Images are optional — publish now and add them later, or save as a draft.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onSubmit('active')}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {isSubmitting ? 'Publishing…' : 'Publish product'}
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onSubmit('draft')}
          className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          Save as draft
        </button>
      </div>
    </div>
  )
}
