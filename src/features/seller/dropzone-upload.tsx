'use client'

import { useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from 'react'
import { Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { uploadProductImage } from './seller-api'

const MAX_BYTES = 5 * 1024 * 1024

export interface DropzoneUploadProps {
  value?: string
  onChange: (url: string | undefined) => void
}

/**
 * Accessible drag-and-drop picker for a single product image. The chosen file is
 * uploaded to Supabase Storage (via the seller upload route) and the resulting
 * public URL is lifted to the parent form through `onChange`.
 */
export function DropzoneUpload({ value, onChange }: DropzoneUploadProps): ReactNode {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File | undefined): Promise<void> {
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('That file is not an image.')
    if (file.size > MAX_BYTES) return setError('Images must be under 5MB.')
    setError('')
    setUploading(true)
    try {
      const url = await uploadProductImage(file)
      onChange(url)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>): void {
    e.preventDefault()
    setDragging(false)
    void handleFile(e.dataTransfer.files[0])
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      inputRef.current?.click()
    }
  }

  return (
    <div>
      {value ? (
        <div className="relative w-40 overflow-hidden rounded-lg ring-1 ring-foreground/10">
          {/* eslint-disable-next-line @next/next/no-img-element -- simple preview of an already-hosted URL */}
          <img src={value} alt="Product image preview" className="aspect-square w-full object-cover" />
          <button
            type="button"
            aria-label="Remove image"
            onClick={() => onChange(undefined)}
            className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-background/90 shadow"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload a product image. Activate to browse files, or drop an image here."
          aria-busy={uploading}
          onClick={() => inputRef.current?.click()}
          onKeyDown={onKeyDown}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragEnter={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
            dragging ? 'border-primary bg-primary/5' : 'border-foreground/20',
          )}
        >
          {uploading ? (
            <p className="flex items-center gap-2 font-medium">
              <Loader2 className="size-4 animate-spin" /> Uploading…
            </p>
          ) : (
            <>
              <p className="font-medium">Drag &amp; drop an image here</p>
              <p className="text-muted-foreground">or click to browse (PNG/JPG/WebP, up to 5MB)</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            tabIndex={-1}
            onChange={(e) => {
              void handleFile(e.target.files?.[0])
              e.target.value = '' // let the same file be re-selected
            }}
            className="sr-only"
          />
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
