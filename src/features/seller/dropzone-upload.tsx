'use client'

import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Preview {
  id: string
  url: string
  name: string
}

const MAX_BYTES = 5 * 1024 * 1024

/**
 * Accessible native drag-and-drop image picker with local previews.
 * Previews are demonstration-only (the mock backend has no blob storage), so
 * files are never submitted — the product store assigns a placeholder image.
 */
export function DropzoneUpload(): ReactNode {
  const [previews, setPreviews] = useState<Preview[]>([])
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const previewsRef = useRef<Preview[]>([])

  useEffect(() => {
    previewsRef.current = previews
  }, [previews])

  // Revoke every outstanding object URL on unmount (avoids memory leaks).
  useEffect(() => {
    return () => {
      previewsRef.current.forEach((p) => URL.revokeObjectURL(p.url))
    }
  }, [])

  function addFiles(fileList: FileList | null): void {
    if (!fileList || fileList.length === 0) return
    const accepted: Preview[] = []
    const rejected: string[] = []
    Array.from(fileList).forEach((file) => {
      if (!file.type.startsWith('image/')) rejected.push(`${file.name} (not an image)`)
      else if (file.size > MAX_BYTES) rejected.push(`${file.name} (over 5MB)`)
      else accepted.push({ id: crypto.randomUUID(), url: URL.createObjectURL(file), name: file.name })
    })
    if (accepted.length) setPreviews((prev) => [...prev, ...accepted])
    setStatus(
      [
        accepted.length ? `Added ${accepted.length} image${accepted.length > 1 ? 's' : ''}.` : '',
        rejected.length ? `Rejected ${rejected.join(', ')}.` : '',
      ]
        .filter(Boolean)
        .join(' '),
    )
  }

  function remove(id: string): void {
    setPreviews((prev) => {
      const target = prev.find((p) => p.id === id)
      if (target) URL.revokeObjectURL(target.url)
      return prev.filter((p) => p.id !== id)
    })
  }

  function onDrop(e: DragEvent<HTMLDivElement>): void {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      inputRef.current?.click()
    }
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload product images. Activate to browse files, or drop image files here."
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
        <p className="font-medium">Drag &amp; drop images here</p>
        <p className="text-muted-foreground">or click to browse (PNG/JPG, up to 5MB each)</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          tabIndex={-1}
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = '' // let the same file be re-selected
          }}
          className="sr-only"
        />
      </div>

      <p aria-live="polite" className="sr-only">
        {status}
      </p>

      {previews.length > 0 && (
        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {previews.map((p) => (
            <li key={p.id} className="relative overflow-hidden rounded-md ring-1 ring-foreground/10">
              {/* eslint-disable-next-line @next/next/no-img-element -- ephemeral blob: object URL, not next/image-optimizable */}
              <img src={p.url} alt={p.name} className="aspect-square w-full object-cover" />
              <button
                type="button"
                aria-label={`Remove ${p.name}`}
                onClick={() => remove(p.id)}
                className="absolute right-1 top-1 rounded-full bg-background/90 px-2 py-0.5 text-xs shadow"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
