# Phase 3 — Buyer Experience & Performance Plan

> **Executor:** agent with repo context. Compact; inline code only where non-obvious. Test-first for logic. **Explicit return types on every component/hook/handler.** Remove unused imports (lint gates). `'use client'` only on interactive leaves.
> **Do NOT push/PR/merge.** Ends with a dev-server verification.

**Goal:** The real storefront — targeted promo carousel, infinite-scroll catalog with debounced search + faceted filters, product-detail with image gallery + variants + stock-limited quantity, dimension-matched skeletons, `next/image` optimization, and segment-level error boundaries. Replaces the temporary Phase-2 seed grid.

**Verified stack:** embla-carousel-react/autoplay 8.6, `@tanstack/react-query` 5.101 (`useInfiniteQuery`: `initialPageParam` required, `getNextPageParam(lastPage,…) => x ?? undefined`, filters in key), `next/image` (**Next 16: `priority` deprecated → `preload`**; AVIF via `formats`). Cart = Redux (Phase 2). Filter state is **component-local `useState`** (transient UI per §3.3), not Redux.

**LCP/data-flow:** catalog grid = client `useInfiniteQuery`. The carousel is a client component but **slide 0 is a deterministic audience-agnostic hero** rendered in SSR markup with a reserved aspect-ratio box and a **preloaded** image (stable LCP); client targeting only affects slides after the hero. MSW handlers (T4) are **test-only**; in dev/prod the browser hits the real T3 route handlers.

---

### T1 — Deps, image config, decision record
`npm i embla-carousel-react embla-carousel-autoplay`. `next.config.ts`: add `images.formats: ['image/avif','image/webp']` (keep picsum remotePattern). Add **DECISIONS D13**: Next 16 deprecated `next/image` `priority` → use `preload`/`loading="eager"`/`fetchPriority="high"` (supersedes CODING_GUIDELINES §3.2.2 wording). Verify build. Commit: `chore: add embla, enable avif, record image priority→preload`.

### T2 — Expand seed catalog (+ optional variants)
`product-schema.ts`: add optional `options: z.array(z.object({ name: z.string(), values: z.array(z.string()).min(1) })).optional()`.
`src/mocks/seed/products.ts`: ~36 products generated **deterministically** (index loop, no `Math.random`) across `audio/peripherals/wearables/home/gaming`, varied price/stock (some `stock:0`), `imageUrl: picsum.photos/seed/<id>/800/800`. **Preserve exactly** (test-load-bearing): `p1` = id `p1`, priceCents `12999`, stock `8`, category `audio`; `p2` = id `p2`, stock `0`, category `peripherals`. Give ~3 products an `options` array (e.g. size/color). Keep `import type { Product } from '@/types'`. Commit: `feat: expand seed catalog (+ optional variants)`.

### T3 — Query schema + server routes (test-first)
`src/lib/schemas/product-query-schema.ts`: `productQuerySchema` (coerced `page`≥1 default 1, `limit` 1–48 default 12, optional `q`, `category`, coerced int `minPrice`/`maxPrice`, coerced boolean `inStock`; guard `Number('')`). `productPageSchema = z.object({ items: z.array(productSchema), nextPage: z.number().int().nullable() })`; `export type ProductPage = z.infer<...>`.
`src/lib/server/product-store.ts` (plain server module, like cart-store): `queryProducts(params): ProductPage` (filter seed by q/category/price/inStock, paginate, `nextPage = end<total ? page+1 : null`), `getProduct(id)`, `listCategories()`. Test-first (node): filter+paginate+nextPage; unknown id → undefined.
Routes: `app/api/products/route.ts` (`GET` → parse searchParams via schema → `queryProducts`); `app/api/products/[id]/route.ts` (`GET`, `await params`, 404 if missing); `app/api/categories/route.ts`. Commit: `feat: product query schema + catalog routes`.

### T4 — MSW product handlers (test-only)
Add `/api/products`, `/api/products/:id`, `/api/categories` to `handlers.ts` (reuse `queryProducts`/`getProduct`/`listCategories`). Note: node/vitest only. Commit: `test: msw product handlers`.

### T5 — Client data hooks (test-first where logic)
`use-debounced-value.ts` (generic `<T>(value, delayMs=300): T`; setTimeout/clear). Unit-test with vitest fake timers.
`catalog-api.ts`: `fetchProducts(filters, pageParam, signal): Promise<ProductPage>` — append only non-empty params (skip `null`/`''`/`false`; guard `Number('')`); forward `signal`; **parse the response with `productPageSchema`** (no `any`).
`use-products.ts`:
```ts
import { useInfiniteQuery, keepPreviousData, type InfiniteData, type UseInfiniteQueryResult } from '@tanstack/react-query'
export interface CatalogFilters { q: string; category: string | null; minPrice: number | null; maxPrice: number | null; inStock: boolean }
export function useProducts(filters: CatalogFilters): UseInfiniteQueryResult<InfiniteData<ProductPage>, Error> {
  return useInfiniteQuery({
    queryKey: ['products', filters],
    queryFn: ({ pageParam, signal }) => fetchProducts(filters, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    placeholderData: keepPreviousData,
  })
}
```
`use-infinite-scroll.ts`: create the IntersectionObserver **once** (callback-ref on the sentinel); keep `fetchNextPage`/`hasNextPage`/`isFetchingNextPage`/`enabled` in refs updated each render; fire only when `isIntersecting && hasNextPage && !isFetchingNextPage && enabled`; `observer.disconnect()` on cleanup. Explicit return types. Commit: `feat: catalog hooks (debounce, infinite query, sentinel)`.

### T6 — Product card (no nested interactive) + skeleton
`product-card.tsx` (`'use client'`): an `<article>` containing an `<a>`/`<Link>` wrapping ONLY the image + title (link to `/products/{id}`), and the add-to-cart `<button>` as a **sibling** in the footer (NOT inside the link). `next/image` `fill` in an `aspect-square relative` box + `sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw"`; title `line-clamp-2 min-h-[2.5rem]`. Disabled "Out of stock" at `stock:0`.
`product-skeleton-card.tsx`: identical wrapper — `aspect-square` image block + two title lines at the same `min-h` + same-height button placeholder, so heights match exactly (CLS). Commit: `feat: product card (a11y-safe) + matched skeleton`.

### T7 — Catalog section (search + filters + infinite grid)
`search-bar.tsx`: `<label>` + `<input role="searchbox">`.
`catalog-filters.tsx`: native `<select>` category (from `/api/categories`), labelled min/max price inputs, labelled in-stock checkbox — update filters immediately.
`catalog-section.tsx` (`'use client'`): **local `useState`** for `{ q, category, minPrice, maxPrice, inStock }` (not Redux); `useDebouncedValue(q)`; `useProducts`; grid of `ProductCard` + `ProductSkeletonCard`s during `isLoading`/`isFetchingNextPage`; sentinel via `use-infinite-scroll` **disabled while `isPlaceholderData`**; when `isPlaceholderData` set `aria-busy="true"` + a polite live-region "Updating results" + dim; empty + error states; wrap grid in `ErrorBoundary`. Commit: `feat: catalog section (search, filters, infinite grid)`.

### T8 — Promo carousel + targeting
`src/features/promo/promos.ts`: seed promos; **index 0 is an `audience:'all'` hero**; others tagged `guest|auth|first-visit`; `href` targets real routes (`/products/<id>` or `/?category=audio`); hero `img` at a larger size (e.g. `picsum.photos/seed/promo-hero/1600/600`).
`use-first-visit.ts`: client hook for a `ts-visited` localStorage flag.
`promo-carousel.tsx` (`'use client'`): embla; attach `Autoplay` **only if not** `window.matchMedia('(prefers-reduced-motion: reduce)').matches` (SSR-guarded); visible **Pause/Play** (WCAG 2.2.2), pause on hover/focus. **A11y:** region `role="region" aria-roledescription="carousel" aria-label`, focusable, `onKeyDown` handling **only** ArrowLeft/ArrowRight (`preventDefault`, guarded `emblaApi`); each slide `role="group" aria-roledescription="slide" aria-label="N of M"`, wrapped in a focusable `<Link href>`; visually-hidden `aria-live="polite"` "Slide N of M". Initialize `selectedIndex/canPrev/canNext/isPlaying` as state with safe defaults, populated in effects gated on `emblaApi` + `select`/`reInit`. **Slide 0 = hero**: rendered first in SSR markup, its `<Image>` uses `preload` (alone) inside a reserved `aspect-[16/6]`(or fixed-height) box; all other slides lazy. Targeting filters/orders **only slides after the hero** (post-hydration), so the LCP hero is stable. Wrap in `ErrorBoundary`. Commit: `feat: accessible promo carousel with targeting`.

### T9 — Product detail page
`src/features/catalog/add-to-cart-button.tsx` (`'use client'`): `AddToCartButtonProps { product: Product; quantity?: number; variantLabel?: string }`; explicit return type; calls `addToCart` (Phase-2 optimistic+rollback) with the quantity; toast includes `variantLabel` if present; disabled at `stock:0`.
`product-gallery.tsx` (`'use client'`): main `next/image` (`loading="eager"`, larger source) + thumbnail `<button>`s (keyboard-operable, `aria-label`); gallery images derived deterministically from the id (`picsum.photos/seed/<id>-1..4/800`).
`app/products/[id]/page.tsx` (server component, `await params`): `getProduct` → `notFound()` if missing; render gallery + title + price + **stock label + quantity selector clamped to `[1, stock]`** (uses `clampQuantity` semantics) + variant chips if `product.options` (selectable, a selection required; default first) + `AddToCartButton` (passes quantity + selected variant label). *(Cart stays keyed by `productId`; variant-aware cart lines are an accepted simplification for the mock — recorded in DECISIONS.)* Wrap dynamic parts in `ErrorBoundary`. Commit: `feat: product detail (gallery, variants, stock-limited quantity)`.

### T10 — Wire home page
`app/page.tsx` (server component): `<PromoCarousel />` then `<CatalogSection />` (remove the temporary seed grid + note). Commit: `feat: storefront home (carousel + infinite catalog)`.

### T11 — Gate + progress (STOP)
1. `npm run build && npm run typecheck && npm run lint && npm test` — all green (build first so `.next/types` exists for typecheck).
2. `PROGRESS.md`: keep Phase 3 `🟡`; add a log line.
3. `rm -rf .next && npm run dev` → hand off. Verify: carousel autoplay (off under reduced-motion) + pause/play + arrows + slide links route; search debounces; filters refetch (grid dims/aria-busy); infinite scroll loads with skeletons; product detail gallery + variant + quantity clamp; add-to-cart from card + detail.

**STOP.** After the user verifies, push `feat/phase-3-buyer` and open the PR.

---

**Coverage vs spec Phase 3:** promo carousel + targeting + clickable/keyboard slides (T8), infinite catalog (T5/T7), debounced search + faceted filters (T5/T7), product detail + **variants** + **stock-limited quantity** + interactive gallery (T2/T9), CLS skeletons + reserved carousel height (T6/T8), `next/image` AVIF/WebP + single-hero preload (T1/T6/T8), segment error boundaries (T7/T8/T9), optimistic add-to-cart reused from Phase 2. A11y: labelled controls, carousel roles/live-region/pause, reduced-motion, no nested interactive.
