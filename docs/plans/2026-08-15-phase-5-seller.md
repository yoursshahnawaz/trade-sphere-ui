# Phase 5 — Seller Portal Implementation Plan

> **Executor:** agent with repo context. Compact; inline code only where non-obvious. Test-first for logic. Explicit return types. Remove unused imports (lint gates). `'use client'` only on interactive leaves.
> **Do NOT push/PR/merge.** Ends with a dev-server verification.

**Goal:** A protected seller workspace: an analytics dashboard (recharts), a sortable/searchable inventory table with status badges, and a 3-step product-onboarding wizard with accessible drag-and-drop image upload.

**Verified stack:** `recharts@3.10.1` (client-only; declares `react-is` as a runtime peer — install it explicitly; ResponsiveContainer needs a parent height; `accessibilityLayer` default on; add sr-only table; 0×0 in jsdom so DON'T assert chart dims in tests), **`@tanstack/react-table@^8` (8.21.3 — pin `@^8`, bare `latest` is v9!)** (client-only; call row-model factories; keep `columns`/`data` referentially stable), `@tanstack/react-query` **v5 object form** `useQuery({ queryKey, queryFn })`, native HTML5 drag-drop (no lib). `/seller/*` is already proxy-gated to `role==='seller'` (Phase 1, no proxy edit needed); `/seller/register` stays public.

**Data model:** `SellerProduct = { id, sellerUid, title, category, priceCents, stock, imageUrl, status: 'active'|'draft' }`. In-memory `seller-store` (via `globalThis`, mirroring `order-store.ts`) lazily seeds ~6 **deterministic** products per seller on first access (pure function of uid — no `Math.random`/`Date.now`); onboarding appends.

---

### T1 — Dependencies
```bash
npm i recharts@3.10.1 react-is "@tanstack/react-table@^8"
```
Verify: `npm ls @tanstack/react-table` shows **8.x** (not 9); `npm ls react-is` shows a hoisted copy; `npm run build` succeeds. Commit: `chore: add recharts + tanstack-table v8`.

### T2 — Seller schema + store + analytics (test-first)
`src/lib/schemas/seller-product-schema.ts`: `sellerProductInputSchema` — `title` min2, `category` min2, `description` optional, `priceCents` int positive, `stock` int nonneg, **`imageUrl` optional (`z.url().optional()`)**, `status` enum `['active','draft']` default `'active'`. `sellerProductSchema` = input shape with **required** `imageUrl` + `{ id, sellerUid }`. Inferred types `SellerProductInput`, `SellerProduct`.
`src/lib/server/seller-store.ts` (`globalThis` `Map<uid, SellerProduct[]>`, exactly like `order-store.ts`):
- `listSellerProducts(uid): SellerProduct[]` — lazy-seed ~6 deterministic products keyed off uid if empty (title/category/price/stock derived from index; imageUrl `https://picsum.photos/seed/${id}/600/600`; include ≥1 draft + ≥1 zero-stock + ≥1 low-stock so every badge appears).
- `addSellerProduct(uid, input: SellerProductInput): SellerProduct` — `id` via `crypto.randomUUID()`; **default `imageUrl` to `https://picsum.photos/seed/${id}/600/600` when absent** (so a `blob:` URL can never reach the store and drafts with zero images still validate); append; return.
- `getSellerAnalytics(uid)` → `{ kpis: { totalSalesCents, activeOrders, traffic }, revenueSeries: { month, revenue }[] (12 entries), topProducts: { title, units }[] (top ≤5 of the seller's products) }`. **Month labels are a STATIC `['Jan'..'Dec']` array — never derived from `new Date()`.** Revenue/units/KPIs are deterministic functions of uid + index. `totalSalesCents = Σ revenueSeries`. `topProducts` derived from `listSellerProducts(uid)` (both paths call it, so RSC and API agree).
`src/lib/server/http.ts`: no new helper — routes inline the two-stage check (see T3), matching `orders/route.ts`.
`src/lib/seller-status.ts` (pure): `productStatus(p: Pick<SellerProduct,'stock'|'status'>): 'In Stock'|'Low Stock'|'Out of Stock'|'Draft'` — draft → Draft; stock 0 → Out of Stock; stock < 5 → Low Stock; else In Stock.
Tests (`// @vitest-environment node`): `productStatus` all four thresholds; `addSellerProduct` appends + defaults imageUrl when omitted + lazy seed returns ≥1; analytics **determinism** — assert exact 12 month labels AND `getSellerAnalytics(u)` deep-equals a second call (same wall-clock-independent output), `topProducts.length ≤ 5`, `totalSalesCents === Σ series`. Commit: `feat: seller schema, store, analytics, status`.

### T3 — Seller API routes + MSW (test-first)
`src/app/api/seller/products/route.ts` — local helper to preserve 401/403 semantics:
```ts
async function requireSeller(): Promise<{ session: SessionClaims } | { status: 401 | 403 }> {
  const session = await requireSession()
  if (!session) return { status: 401 }
  if (session.role !== 'seller') return { status: 403 }
  return { session }
}
```
`GET`: `const g = await requireSeller(); if ('status' in g) return new Response(null,{status:g.status})` → `{ products: listSellerProducts(g.session.sub) }`. `POST`: `isSameOrigin` guard (403 else), `requireSeller`, parse `sellerProductInputSchema` (400 on failure) → `addSellerProduct(g.session.sub, parsed)` → `{ product }` 201.
Add GET+POST `/api/seller/products` handlers to the **shared** `src/mocks/handlers.ts` array (GET `{ products: [...] }`, POST echoes `{ product }` 201) — required because `vitest.setup.ts` runs `onUnhandledRequest:'error'`, so client tests mounting the table/wizard would otherwise hard-error.
Route test (`node` env, `vi.mock('@/lib/server/http')` like `orders-routes.test.ts`): **unauthenticated → 401**, buyer → 403, seller GET returns products, seller POST (body without imageUrl) → 201 and product has a defaulted imageUrl. Commit: `feat: seller product routes + msw`.

### T4 — Charts
`src/features/seller/revenue-chart.tsx` (`'use client'`): `RevenueChart({ data }: { data: {month,revenue}[] })` — recharts `ResponsiveContainer` inside `<div className="h-72">`, `LineChart` (XAxis month, YAxis $, Tooltip, Line), wrapped in `<figure aria-label>` + an `sr-only` `<table>` mirroring the data.
`src/features/seller/top-products-chart.tsx` (`'use client'`): `TopProductsChart({ data })` — `BarChart` + `Bar`, same sr-only fallback.
No jsdom chart-render test (ResponsiveContainer is 0×0 in jsdom); charts are verified in the T8 dev step. Commit: `feat: seller analytics charts (recharts + sr-only fallback)`.

### T5 — Inventory table
`src/features/seller/status-badge.tsx`: colored badge from `productStatus` (green/amber/red/gray).
`src/features/seller/inventory-table.tsx` (`'use client'`): `@tanstack/react-table` with `getCoreRowModel()/getSortedRowModel()/getFilteredRowModel()`; **module-scope `columns: ColumnDef<SellerProduct>[]`** — title, category, price (formatted), stock, and a **status accessor** `accessorFn: (p) => productStatus(p)` whose cell renders `<StatusBadge>` (accessor form so the global filter matches status text like "draft"/"low"). Controlled `sorting` + `globalFilter` state; a labelled search `<input>` bound to `globalFilter`; semantic `<table>` with `<th scope="col">`, sortable headers as `<button>` via `getToggleSortingHandler()`, `aria-sort` from `getIsSorted()` (`asc→ascending`, `desc→descending`, `false→none`); `flexRender`.
Data via `useQuery({ queryKey: ['seller-products'], queryFn })` (v5 object form). **Mirror `catalog-section.tsx`:** dimension-matched skeleton rows while `isLoading` (`aria-busy`), an `isError` branch with `role="alert"` + Retry button calling `refetch()`, and wrap the region in the existing `<ErrorBoundary>` (`src/components/error-boundary`).
Test (jsdom, wrapped in `QueryClientProvider` + fresh `QueryClient`; MSW handler from T3): renders seeded rows, clicking a header toggles its `aria-sort`, typing in search filters rows (incl. by status text). Commit: `feat: sortable/searchable inventory table`.

### T6 — Product onboarding (drag-drop upload + wizard)
`src/features/seller/dropzone-upload.tsx` (`'use client'`): accessible native drag-drop — drop zone `role="button" tabIndex={0}` (Enter/Space triggers the hidden input; `onDragOver`/`onDragEnter` `preventDefault`; `onDrop` reads `e.dataTransfer.files`); hidden `<input type="file" accept="image/*" multiple tabIndex={-1}>` (visually-hidden via `clip`, reset `value=''` after read); validate `type.startsWith('image/')` + size ≤ ~5MB (both on drop and change); previews via `URL.createObjectURL` **revoked on removal and on unmount** (store `{id,url,file}` in state, never mint URLs in render); render each preview with a plain `<img>` (`// eslint-disable-next-line @next/next/no-img-element` + comment: ephemeral `blob:` object URLs aren't `next/image`-optimizable); `aria-live="polite"` status; each Remove button names its file. Emits current files to the parent (previews only — never submitted).
`src/features/seller/onboarding-state.ts`: `useReducer` — steps `details → pricing → images`; per-step commit + `back` (no arbitrary skip).
Steps (`'use client'`, RHF + `zodResolver` over per-step slices of `sellerProductInputSchema`, inline `FieldError` role=alert): `details-step` (title, category `<select>` from `useQuery({ queryKey:['categories'], ... })`, description); `pricing-step` (price in dollars → cents, stock int — invalid price/stock shows inline `FieldError` and **blocks Next**, matching checkout); `images-step` (DropzoneUpload; images optional — a product can be saved as draft with none).
`src/features/seller/onboarding-wizard.tsx` (`'use client'`): stepper (`aria-current`), focus the step heading on change, per-step validation gates advancement; on finish → `POST /api/seller/products` (imageUrl omitted — store defaults it; `status:'draft'` if "Save as draft" chosen), `queryClient.invalidateQueries({ queryKey: ['seller-products'] })`, toast, `router.push('/seller/inventory')`.
**Integration test** (jsdom, `QueryClientProvider` + MSW, mirror `checkout-wizard.test.tsx`): advancing is blocked on empty title / non-positive price / missing category (`findAllByRole('alert')`); completing all 3 steps fires `POST /api/seller/products` and calls `router.push('/seller/inventory')`. Commit: `feat: product onboarding wizard + drag-drop upload`.

### T7 — Seller pages + nav (route group so register stays bare)
`src/features/seller/seller-nav.tsx` (`'use client'`, presentational, no fetch): links Dashboard / Inventory / Add product (`aria-current` via `usePathname`).
`src/app/seller/(portal)/layout.tsx` (server): renders `<SellerNav />` + `children`; type via the generated `LayoutProps` helper (match `src/app/layout.tsx`), fall back to `{ children: React.ReactNode }` if friction. The `(portal)` route group keeps the existing public `src/app/seller/register/page.tsx` OUTSIDE this layout (no nav bleed).
`src/app/seller/(portal)/page.tsx` (`/seller`, server): `const s = await requireSession(); if (!s) redirect('/login?returnUrl=/seller')` (defense-in-depth, mirrors `orders/page.tsx`) → `getSellerAnalytics(s.sub)`; KPI cards + `<RevenueChart>` + `<TopProductsChart>`.
`src/app/seller/(portal)/inventory/page.tsx` (server): renders `<InventoryTable>` (client fetches).
`src/app/seller/(portal)/products/new/page.tsx` (server): renders `<OnboardingWizard>`.
Commit: `feat: seller dashboard, inventory, onboarding pages + nav`.

### T8 — Gate + docs (STOP)
1. `npm run build && npm run typecheck && npm run lint && npm test` — all green.
2. `PROGRESS.md` → log line (keep 🟡). `DECISIONS.md` → new entries: **deterministic (non-random, static-label) analytics** so tests are stable; **placeholder picsum imageUrl** because blob previews aren't persisted in the mock (no blob storage); **`@tanstack/react-table` pinned to `^8`** (bare `latest` is v9).
3. `rm -rf .next && npm run dev` → hand off. Verify **as a seller**: dashboard charts render (+ keyboard nav + sr-only tables), inventory table sorts + searches (incl. by status) with badges, table shows skeleton then data (no CLS) and an error/retry on failure, onboarding wizard blocks advancement on invalid input, drag-drop upload previews + removes, submit adds the product to inventory. Verify a **buyer** is redirected off `/seller`, and `/seller/register` shows NO portal nav.

**STOP.** After the user verifies, push `feat/phase-5-seller` and open the PR.

---

**Coverage vs spec Phase 5:** protected seller workspace (proxy role-gate + RSC defense-in-depth, T7); analytics dashboard — total sales, revenue trend, active orders, traffic + top products (T2/T4/T7); sortable/searchable inventory table with dynamic status badges + skeleton/error/retry (T5); multi-step guided onboarding with client-side business-rule validation (positive price, required category, integer stock) + drag-drop image upload with previews (T6). A11y: chart sr-only fallbacks + accessibilityLayer, `aria-sort` headers, `aria-current` stepper/nav, `aria-live` dropzone, keyboard-operable dropzone. Tests: analytics/status units, route 401/403/200, table sort/search, onboarding integration.
