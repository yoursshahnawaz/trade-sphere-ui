'use client'

import { useState, type ReactNode } from 'react'
import Image from 'next/image'

export interface ProductGalleryProps {
  images: string[]
  alt: string
}

export function ProductGallery({ images, alt }: ProductGalleryProps): ReactNode {
  const [active, setActive] = useState(0)
  const main = images[active] ?? images[0]!

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        <Image
          src={main}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
          loading="eager"
        />
      </div>
      <div className="flex gap-2">
        {images.map((img, i) => (
          <button
            key={img}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`View image ${i + 1}`}
            aria-pressed={active === i}
            className={`relative aspect-square w-16 overflow-hidden rounded-md border ${
              active === i ? 'border-primary' : ''
            }`}
          >
            <Image src={img} alt="" fill sizes="64px" className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}
