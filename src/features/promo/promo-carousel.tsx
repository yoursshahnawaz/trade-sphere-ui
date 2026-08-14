'use client'

import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { useAppSelector } from '@/store/hooks'
import { promos, type Promo } from './promos'

// SSR-safe reduced-motion via useSyncExternalStore (server snapshot = false).
function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
      mql.addEventListener('change', cb)
      return () => mql.removeEventListener('change', cb)
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  )
}

export function PromoCarousel(): ReactNode {
  const status = useAppSelector((s) => s.auth.status)
  const firstVisit = useAppSelector((s) => s.ui.firstVisit)
  const reducedMotion = useReducedMotion()

  // Targeting: hero (index 0) is always first & stable; filter the rest.
  const slides: Promo[] = promos.filter((p, i) => {
    if (i === 0) return true
    if (p.audience === 'all') return true
    if (p.audience === 'guest') return status !== 'authenticated'
    if (p.audience === 'auth') return status === 'authenticated'
    return firstVisit // 'first-visit'
  })

  const [autoplayPlugin] = useState(() =>
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true, stopOnFocusIn: true }),
  )
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' }, [autoplayPlugin])

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = (): void => setSelectedIndex(emblaApi.selectedScrollSnap())
    const syncPlay = (): void => setIsPlaying(emblaApi.plugins().autoplay?.isPlaying() ?? false)
    onSelect()
    syncPlay()
    emblaApi.on('select', onSelect).on('reInit', onSelect)
    emblaApi.on('autoplay:play', syncPlay).on('autoplay:stop', syncPlay)
    return () => {
      emblaApi.off('select', onSelect).off('reInit', onSelect)
      emblaApi.off('autoplay:play', syncPlay).off('autoplay:stop', syncPlay)
    }
  }, [emblaApi])

  // Respect reduced-motion: stop autoplay.
  useEffect(() => {
    if (reducedMotion) emblaApi?.plugins().autoplay?.stop()
  }, [emblaApi, reducedMotion])

  // Re-measure when the targeted slide set changes after hydration.
  useEffect(() => {
    emblaApi?.reInit()
  }, [emblaApi, slides.length])

  const scrollPrev = useCallback((): void => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback((): void => emblaApi?.scrollNext(), [emblaApi])
  const toggleAutoplay = useCallback((): void => {
    const autoplay = emblaApi?.plugins().autoplay
    if (!autoplay) return
    if (autoplay.isPlaying()) autoplay.stop()
    else autoplay.play()
  }, [emblaApi])

  function onKeyDown(e: React.KeyboardEvent<HTMLElement>): void {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      scrollPrev()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      scrollNext()
    }
  }

  const total = slides.length

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Promotions"
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="relative outline-none"
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((promo, i) => (
            <div
              key={promo.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${total}`}
              className="relative min-w-0 flex-[0_0_100%]"
            >
              <Link href={promo.href} className="block">
                <div className="relative aspect-[16/6] w-full overflow-hidden bg-muted">
                  <Image
                    src={promo.img}
                    alt={promo.title}
                    fill
                    sizes="100vw"
                    className="object-cover"
                    preload={i === 0}
                  />
                  <div className="absolute inset-0 flex flex-col justify-center gap-1 bg-gradient-to-r from-black/60 to-transparent p-6 text-white">
                    <h2 className="text-xl font-bold sm:text-3xl">{promo.title}</h2>
                    <p className="text-sm sm:text-base">{promo.subtitle}</p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="Previous slide"
        onClick={scrollPrev}
        className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-background/80 p-2 hover:bg-background"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={scrollNext}
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-background/80 p-2 hover:bg-background"
      >
        <ChevronRight className="size-5" />
      </button>
      <button
        type="button"
        aria-label={isPlaying ? 'Pause promotions' : 'Play promotions'}
        onClick={toggleAutoplay}
        className="absolute right-2 bottom-2 rounded-full bg-background/80 p-2 hover:bg-background"
      >
        {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
      </button>

      <p className="sr-only" aria-live="polite">
        Slide {selectedIndex + 1} of {total}
      </p>
    </section>
  )
}
