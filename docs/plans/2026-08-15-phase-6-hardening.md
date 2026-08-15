# Phase 6 — Hardening Implementation Plan

> **Executor:** agent with repo context. Compact; test-first for logic. Explicit return types. Remove unused imports (lint gates). **Do NOT push/PR/merge.** Ends with a dev-server verification.

**Goal:** Final polish against the NFRs — accessibility sweep (landmarks + skip link + route focus + automated axe checks), Core-Web-Vitals/SEO metadata, test-coverage tooling + gap fill, and finalized docs (README + DECISIONS + PROGRESS).

**Already done — verify-and-move-on, do NOT redo:** `<html lang="en">`; `prefers-reduced-motion` (promo carousel); cart-badge / cart-subtotal / order-summary `aria-live`; `FieldError`/auth-error `role="alert"`; `next/image` `sizes` on all images + hero `preload={i===0}`; `next.config` AVIF/WebP; chart fixed-height (`h-72`) wrappers; dimension-matched skeletons; `SellerNav` already has `aria-label="Seller portal"`; wizards already do per-step focus.

---

### T1 — Landmarks, skip link, headings, route focus
- `src/app/layout.tsx`: as the first `<body>` child add a skip link → `<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">Skip to main content</a>`. Change `<div className="flex-1">` → `<main id="main-content" tabIndex={-1} className="flex-1">` (the one landmark for every route; `tabIndex={-1}` guarantees skip-link focus).
- Demote the page-level `<main>` in the **9 files that actually have one** (grep `<main` under `src/app` to confirm) to `<div>` preserving existing classes: `products/[id]`, `orders`, `orders/[id]`, and `seller/(portal)/{page, inventory, orders, orders/[id], products/new (bare, no class), products/[id]/edit}`. (checkout, `(auth)/login`, `(auth)/register`, `seller/register`, home already render `<div>` — no change.)
- **Exactly one `<h1>` per route.** Add where missing: home (`src/app/page.tsx` → `<h1 className="sr-only">Trade-Sphere marketplace</h1>`), checkout (`checkout/page.tsx` → sr-only `<h1>Checkout</h1>` above the wizard). For `(auth)/login`, `(auth)/register`, `seller/register`: promote their visible top heading to `<h1>` if it's an `<h2>`, else add sr-only `<h1>`. Leave the wizards' focus-managed `<h2>` step titles as-is.
- Landmark uniqueness: give the Header `<nav>` `aria-label="Primary"` (SellerNav already labeled).
- Route-change focus: add `src/components/layout/route-focus.tsx` (`'use client'`) — on `usePathname()` change (skip initial mount) move focus to `#main-content`; render it in the root layout. Keeps keyboard/SR users oriented across client navigation.
Commit: `feat: single main landmark, skip link, per-route h1, route focus`.

### T2 — Automated a11y tests (axe-core, already installed v4.13)
- `src/test/axe.ts`: `import axe from 'axe-core'` (CJS default import). `expectNoAxeViolations(container: HTMLElement, extraDisabled?: string[]): Promise<void>` — runs `axe.run(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false }, ...off(extraDisabled) } })` (jsdom can't compute contrast; `region`/landmark rules are page-level and false-positive on isolated component renders) and asserts `results.violations` is empty, printing `id` + node `html`/`target` on failure.
- Add `*.a11y.test.tsx` (jsdom) reusing **each surface's existing sibling-test providers/mocks** (redux `Provider`+`makeStore`, `QueryClientProvider`, `vi.mock('next/navigation')`, auth-client mock as needed). MSW runs `onUnhandledRequest:'error'`, so any mount-time fetch (CatalogSection/InventoryTable/CheckoutWizard) needs its handler — they exist in `handlers.ts`. Surfaces: `ProductCard`, `ProductDetailPanel`, `Header` (buyer + seller), `CheckoutWizard` (cart step), `InventoryTable`, `OnboardingWizard`, login form, **and the NFR-named overlays opened before `axe.run`**: `CartDrawer` (open via `setCartDrawerOpen(true)`/prop), `PromoCarousel`, Header account dropdown (open). Fix every violation surgically.
- Live-region audit (one assertion or comment per): cart badge/subtotal, checkout total, validation errors, Sonner toaster mounted — confirm present (they are), don't duplicate.
Commit: `test: automated axe a11y checks + fixes`.

### T3 — Metadata (SEO/CWV) + documented CWV audit
- Root `metadata` (`layout.tsx`): `metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000')`, `title: { default: 'Trade-Sphere', template: '%s · Trade-Sphere' }`, keep description, minimal `openGraph`. Add `NEXT_PUBLIC_SITE_URL=` to `.env.example`.
- Per-route `export const metadata` (title + description): login, register, seller/register, orders, checkout, seller portal pages (Dashboard/Inventory/Orders/Add product/Edit). `generateMetadata` on `products/[id]`: `const { id } = await params; const p = getProduct(id); return { title: p?.title ?? 'Product' }` (synchronous store lookup; do not `notFound()` here).
- **CWV audit (code-level; live Lighthouse needs Chrome, not reproducible here — documented in README/DECISIONS as a known limitation, incl. color-contrast verified out-of-band).** Explicit, falsifiable checklist:
  - [ ] LCP on `/` is the promo hero image (index 0) which already has `preload` — confirm; **do NOT** add `preload` to the first `ProductCard` (below fold, wastes bandwidth).
  - [ ] `recharts` is code-split out of buyer routes — verify via `next build` output (recharts only in `seller/(portal)/*` chunks).
  - [ ] `next/font` (Geist) produces no CLS (default `font-display: swap` + size-adjust fallback) — confirm, no change expected.
  - [ ] Re-confirm the "already done" list above; fix only genuine gaps.
Commit: `feat: per-route metadata + CWV audit`.

### T4 — Coverage tooling + gap fill (target real logic)
```bash
npm i -D @vitest/coverage-v8@^4
```
- `vitest.config.ts`: `coverage: { provider: 'v8', reporter: ['text', 'html'], include: ['src/**/*.{ts,tsx}'], exclude: ['src/**/*.test.*', 'src/mocks/**', 'src/test/**', 'src/**/*.d.ts', 'src/app/**/layout.tsx'] }`. Add `"test:coverage": "vitest run --coverage"`.
- Add tests for the **logic that matters**, not trivia: `src/features/checkout/checkout-state.ts` (the step machine — assert no skipping to Review without prior steps, `back` transitions) and `src/features/seller/onboarding-state.ts` reducer; plus `src/lib/product-price.ts` `effectivePriceCents` (quick add). Consider a per-file `coverage.thresholds` on `checkout-state.ts`. Run coverage; note the summary. Don't chase 100%.
Commit: `test: coverage tooling + fill checkout/onboarding/pricing gaps`.

### T5 — Docs finalize
- `README.md`: overview, stack, **setup** (`.env.local` from `.env.example`, Firebase keys, `SESSION_JWT_SECRET`, `NEXT_PUBLIC_SITE_URL`), scripts, architecture (App Router + feature folders + in-app BFF), auth model (Firebase ID token → JWKS verify → HttpOnly session JWT → `proxy.ts`), **accessibility** (one `<main>`, skip link, route focus, axe tests, color-contrast checked out-of-band), **CWV** approach + the documented-audit limitation, testing/coverage, pointers to `DECISIONS.md`/`PROGRESS.md`.
- `DECISIONS.md`: D22 (a11y: one `<main>`+skip link+route-focus+axe with color-contrast/region disabled in jsdom, contrast verified out-of-band), D23 (coverage via v8, reported not globally hard-gated; per-file threshold on the checkout state machine).
- `PROGRESS.md`: Phase 6 log line; mark Phase 6 ✅ only after merge (leave 🟡 now).
Commit: `docs: add README + finalize decisions/progress`.

### T6 — Gate + dev (STOP)
1. `npm run typecheck && npm run lint && npm test && npm run build` — fast checks first, build last, all green.
2. `npm run test:coverage` — capture summary for the PR.
3. `npm run dev` → hand off. Verify: Tab from top reveals the skip link → jumps to content; per-tab titles; route change moves focus to main; keyboard-only nav catalog → product → cart drawer (open/Escape/focus) → checkout; seller portal keyboard nav + dropdown.

**STOP.** After the user verifies, push `feat/phase-6-hardening` and open the PR.

---

**Coverage vs Phase 6 scope:** a11y sweep (T1 landmarks/skip link/h1/route focus/nav labels, T2 automated axe + overlay surfaces + fixes), CWV/Lighthouse audit (T3 metadata + falsifiable code-level CWV checklist, contrast/Lighthouse documented as out-of-band), coverage fill (T4 tooling + checkout/onboarding/pricing), docs finalize (T5).
