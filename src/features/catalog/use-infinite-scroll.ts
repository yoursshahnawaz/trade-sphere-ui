import { useCallback, useEffect, useRef } from 'react'

export interface InfiniteScrollOptions {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  enabled: boolean
  fetchNextPage: () => void
}

/**
 * Returns a callback ref for a sentinel element. The IntersectionObserver is
 * created once per sentinel node and reads the latest options via a ref (updated
 * in an effect), so it never churns when fetchNextPage/hasNextPage identities
 * change between renders.
 */
export function useInfiniteScroll(
  options: InfiniteScrollOptions,
): (node: HTMLElement | null) => void {
  const optionsRef = useRef(options)
  useEffect(() => {
    optionsRef.current = options
  })
  const observerRef = useRef<IntersectionObserver | null>(null)

  const setSentinel = useCallback((node: HTMLElement | null): void => {
    observerRef.current?.disconnect()
    if (!node) return
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const { hasNextPage, isFetchingNextPage, enabled, fetchNextPage } = optionsRef.current
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage && enabled) {
          fetchNextPage()
        }
      },
      { rootMargin: '200px' },
    )
    observerRef.current.observe(node)
  }, [])

  useEffect(() => () => observerRef.current?.disconnect(), [])

  return setSentinel
}
