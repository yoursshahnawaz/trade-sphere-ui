# Architecture Decision Log

Short records of non-obvious engineering choices: **what** was decided, the **alternatives** considered, and **why**. Newest entries at the bottom of each phase. Format is intentionally lightweight (ADR-lite).

---

## Phase 0 — Foundation

### D1 — Framework: Next.js App Router
- **Alternatives:** Vite + React SPA, Remix.
- **Decision:** Next.js App Router + TypeScript.
- **Why:** The requirements map directly onto Next.js primitives — routing middleware for smart auth interception, `next/image` for the LCP/CLS bar, HTTP-only cookies via route handlers, and SSR/streaming for Core Web Vitals. A Vite SPA would need a separate server just to satisfy the cookie-auth and SSR-perf requirements; Next.js gives us a real server layer in one app.

### D2 — Identity: Firebase client + HTTP-only session cookie
- **⚠️ Superseded by D9** (we verify the ID token via Google JWKS and mint our own JWT instead of using Admin `createSessionCookie`).
- **Alternatives:** Firebase client tokens held in the browser; a fully custom auth backend.
- **Decision:** Sign in with the Firebase client SDK, exchange the ID token for a server-minted **session cookie** (`firebase-admin` `createSessionCookie`) set **HttpOnly + Secure + SameSite=Lax**.
- **Why:** The problem statement forbids storing session data in `localStorage`/`sessionStorage` and mandates HTTP-only cookies synchronized with routing middleware. Firebase Auth alone persists tokens client-side; the cookie exchange makes the **server-managed cookie the source of truth**, satisfying the security requirement while keeping Firebase's low-effort identity.

### D3 — Middleware verification: Edge presence-check + server-side verify
- **⚠️ Superseded by D9** (our session token is our own JWT, so Edge middleware can fully verify it with `jose` — no presence-only compromise needed).
- **Alternatives:** Full cryptographic verification inside Edge middleware.
- **Decision:** Edge middleware only checks the session cookie's **presence** (and handles redirect + intent capture); **full verification** (`verifySessionCookie`) and role checks happen in the Node server layer.
- **Why:** `firebase-admin` uses Node APIs and cannot run in the Edge runtime where middleware executes. Splitting responsibilities keeps middleware fast and Edge-safe while still enforcing real verification where data is accessed. (Fallback if we ever need in-middleware verification: mint our own short-lived JWT and verify with `jose`.)

### D4 — Backend: in-app route-handler BFF (not a separate service)
- **Alternatives:** A dedicated standalone backend service + real database.
- **Decision:** Next.js **route handlers as a mock BFF** over seed data, with server code bounded in `src/lib/server/` + `src/app/api/`.
- **Why:** Speed is the stated priority and this is a UI-focused assessment. The route handlers are already a genuine Node server (running `firebase-admin`), so this is not a stub. Clean boundaries mean the server can be lifted into a standalone service later without rewriting the frontend.

### D5 — State ownership: Redux for cart, TanStack Query for server data
- **Alternatives:** Cart in TanStack Query with optimistic mutations; a single state tool for everything.
- **Decision:** **Redux Toolkit** owns `cart`/`auth`/`ui` (cart optimism lives in the slice); **TanStack Query** owns server-fetched data (catalog, product, analytics, orders). The cart is **not** a Query.
- **Why:** The heavy cart requirements (guest persistence, guest→auth merge, logout teardown, rehydrate) are client-state lifecycle concerns better modeled in Redux. Mixing Redux cart with TanStack optimistic updates (as the original plan did) creates two sources of truth for the cart.

### D6 — Dropped: redux-saga, redux-persist, nookies
- **Decision:** Use `createListenerMiddleware` (not saga) for login-merge/logout-teardown; a small store subscription (not redux-persist) for guest-cart persistence; Next's native `cookies()` (not nookies).
- **Why:** YAGNI. Saga is unnecessary weight when RTK ships listener middleware; redux-persist is notoriously fragile with App Router SSR hydration; `nookies` is redundant because HTTP-only cookies must be set server-side, which `cookies()` already handles.

### D7 — UI primitives: shadcn/ui (Base UI)
- **Alternatives:** Hand-rolled accessible components on plain Tailwind.
- **Decision:** shadcn/ui for Dialog/Drawer/Dropdown/Tabs. **Note (corrected at implementation):** the installed shadcn CLI (v4.18) defaults to the `base-nova` style backed by **`@base-ui/react`**, not Radix — so import primitives from `@base-ui/react`, never `@radix-ui/*` (not installed).
- **Why:** The a11y requirements (keyboard-operable carousels/drawers, focus traps, `aria-expanded`) are hard and error-prone to hand-roll. Base UI provides correct behavior out of the box while staying pure Tailwind and copy-in (no heavy dependency).

### D8 — Package manager: npm
- **Decision:** Use npm (Node 24 / npm 11 already installed); do not install pnpm.
- **Why:** Avoids extra setup; no monorepo or workspace needs that would justify pnpm here.

---

## Phase 1 — Auth & routing

### D9 — Session: verify Firebase ID token via Google JWKS + our own HttpOnly JWT (no Admin SDK)
- **Supersedes D2 & D3.**
- **Alternatives:** Firebase Admin `createSessionCookie` (needs a service-account secret); Firebase Auth Emulator (needs Firebase CLI + Java).
- **Decision:** Client signs in with Firebase (email/password + Google) → sends the ID token to `POST /api/auth/session` → server verifies it against **Google's public keys with `jose`** (no service account) → mints our own **HS256 session JWT** (`{ sub: uid, email, role }`) set **HttpOnly + Secure(prod) + SameSite=Lax**. `proxy.ts` verifies this JWT directly with `jose`.
- **Why:** Only the **public** Firebase web config is needed (no secret to manage), and because the session token is our own JWT the **proxy can fully verify it** rather than a presence-only check — a cleaner solve than D3.
- **Runtime correction:** Next 16 renamed `middleware.ts` → **`proxy.ts`**, which defaults to the **Node.js runtime** (the `runtime` config is unavailable and throws). The earlier "Edge" framing is dropped; `jose` runs fine on Node 24, so the JWKS + self-minted-JWT design is unchanged. Role is assigned **server-side by endpoint** (`/api/auth/seller-register` is the only path granting `seller`), never trusted from the login body.

### D10 — Sign-in methods: Email/Password + Google
- **Decision:** Support both email/password and Google OAuth (`signInWithPopup`).
- **Why:** Requested; demonstrates classic credential and federated auth. Firebase manages the credential store — we never store passwords.

### D11 — App data store: in-app BFF keyed by `uid`
- **Alternatives:** Supabase (Postgres), Firestore.
- **Decision:** Store role/profile (and later products/orders) in the Next.js BFF keyed by Firebase `uid`; role is embedded in the session JWT at login.
- **Why:** Speed; matches D4; cleanly swappable to Supabase/Firestore later. Role can't be a Firebase custom claim without the Admin SDK, so it lives here.

### D12 — Role model: one role per account, separate seller signup
- **Alternatives:** Single account with a later "become a seller" onboarding (users can be both).
- **Decision:** One role per account. Buyers register at `/register`, sellers at `/seller/register` (+ store name); the route sets the role. Shared `/login`; post-login routing by role (seller → `/seller`, buyer → returnUrl or `/`).
- **Why:** Matches the spec's isolated seller routing and is the simplest way to demo both personas from fresh accounts.

---

## Phase 3 — Buyer & performance

### D13 — Image priority → preload (Next 16)
- **Updates CODING_GUIDELINES §3.2.2** (which says `priority={true}`).
- **Decision:** In Next 16 the `next/image` `priority` prop is **deprecated**; use `preload` (alone) on the single above-the-fold LCP image (the carousel hero), and default `loading="lazy"` everywhere else. Enable AVIF via `images.formats: ['image/avif','image/webp']`.
- **Why:** Verified against the bundled Next 16.3 docs; `priority` still works but new code should use `preload`. Preloading exactly one hero (not every image) protects LCP.

### D14 — Variant selection is UI-only (cart keyed by productId)
- **Decision:** Product detail shows variant chips (from an optional `product.options`) and requires a selection, but the cart line stays keyed by `productId` — the selected variant is surfaced in the add-to-cart toast, not persisted as a distinct cart line.
- **Why:** Satisfies the spec's "display variant selections" without reworking the Phase-2 cart/merge/BFF to be variant-aware. Variant-aware cart lines are an accepted deferral for the mock.

---

## Phase 4 — Checkout

### D15 — Orders are server-rendered, not a client Query (for now)
- **Alternatives:** Model orders as a TanStack Query (per design §3.3) with logout cache invalidation.
- **Decision:** Place the order via a plain `POST /api/orders` and render the confirmation page as a **server component** reading the order store directly. Orders don't enter the Query cache in Phase 4, and order-cache teardown on logout is deferred (there's no order Query to invalidate).
- **Why:** The funnel is server-authoritative and confirmation is a one-shot server render — a client order Query adds no value yet. Revisit if an order-history list is added.
- **Security notes:** order line items + totals are computed from the **server cart** (never trusted from the client body); only `{ method, cardLast4 }` is sent/stored (no full PAN); `GET /api/orders/[id]` enforces `order.uid === session.sub` (no IDOR).

---

## Phase 5 — Seller portal

### D16 — Deterministic analytics (no `Math.random` / no `Date.now`)
- **Alternatives:** Randomized demo data; a real time series anchored to the current date.
- **Decision:** `getSellerAnalytics(uid)` derives every value from an FNV-1a hash of the uid + a fixed index, with **static `['Jan'..'Dec']` month labels**. `totalSalesCents` is exactly the sum of the revenue series.
- **Why:** Same input → identical output regardless of wall-clock, so the data is stable across a page render and its client re-fetch, and unit tests can assert exact values. Date-relative labels would make snapshots flaky (the task explicitly warned against `Date.now`-dependent output).

### D17 — Onboarding images are preview-only; store assigns a placeholder URL
- **Alternatives:** Upload blobs to real storage; submit the `blob:` object URL as `imageUrl`.
- **Decision:** The drag-and-drop uploader renders local `URL.createObjectURL` previews (revoked on removal + unmount) but **never submits files**. `imageUrl` is **optional** in `sellerProductInputSchema`; `addSellerProduct` defaults it to a deterministic `picsum` URL derived from the new product id.
- **Why:** The mock BFF has no blob storage, and a `blob:` URL is ephemeral (invalid after reload) so it can't be persisted. Making `imageUrl` server-defaulted means a client can never send a `blob:` URL or omit a required field — drafts with zero images still validate.

### D18 — Pin `@tanstack/react-table` to `^8`
- **Alternatives:** Install the bare `latest`.
- **Decision:** Pin `@tanstack/react-table@^8` (resolves to 8.21.3).
- **Why:** npm `latest` now points at v9 (9.1.x), which has a different API surface. Pinning `^8` keeps the documented v8 hooks (`getCoreRowModel()` factories, `flexRender`, `getIsSorted()` → `aria-sort`) the inventory table is built on.
- **Notes:** `useReactTable` returns non-memoizable functions, so this one component opts out of the React Compiler (a documented, expected trade-off) via a single `eslint-disable`. API routes enforce their own **401 (no session) / 403 (wrong role)** distinction (`requireSeller`), not just the proxy gate. The portal lives in a `(portal)` route group so its nav layout doesn't wrap the public `/seller/register`.

### D19 — Unified catalog: seller products feed the buyer storefront
- **Alternatives:** Keep the Phase 3 buyer seed and the Phase 5 seller store as two disconnected mocks (seller portal never affects the storefront).
- **Decision:** The buyer catalog is `seedProducts` (representing other sellers) **plus every seller's ACTIVE products**. `queryProducts`/`getProduct` union the two; `cart-store` re-derives lines through `getProduct`; seller product ids are prefixed with the uid so they're unique in the union. Draft products never reach buyers.
- **Why:** A multi-vendor marketplace means buyers see sellers' products — edits, deletes, stock, and offers must reflect on the storefront. The union keeps the demo catalog populated without a full data-model rewrite of merged Phase 3 code.

### D20 — Offers are a per-product sale price; cart charges the effective price
- **Alternatives:** Percent-discount; a separate promo-code system; storefront-invisible offers.
- **Decision:** `salePriceCents` (optional, must be `< priceCents`) on the product. Storefront + inventory show the struck-through original next to the sale price; `effectivePriceCents()` is the single source for what the buyer pays, used by the cart re-derivation and optimistic client adds. A PATCH with `salePriceCents: null` clears an offer.
- **Why:** Simplest offer model that's honest end-to-end (buyer sees it, pays it, order totals reflect it). Kept in one helper so display and billing never drift.

### D21 — Seller orders + role-appropriate chrome
- **Decision:** Seller "active orders" is backed by deterministic mock orders (`seller-orders.ts`, list + detail RSC pages, ownership scoped by uid) rather than a bare KPI number; the dashboard KPI is the count of non-delivered orders. The global header hides the buyer cart and buyer "My orders" for sellers, showing seller portal links instead (roles are one-per-account, D12).
- **Why:** Sellers manage orders, they don't shop. Quantities in the deterministic generator use unsigned shifts to stay positive (a signed `>>` on a 32-bit hash can go negative → zero/negative quantities).

---

## Phase 6 — Hardening

### D22 — Accessibility: one `<main>` + skip link + route focus + axe (contrast checked out-of-band)
- **Alternatives:** Per-page `<main>` landmarks; a matcher lib (`vitest-axe`); trusting color-contrast in jsdom.
- **Decision:** The root layout owns the single `<main id="main-content" tabIndex={-1}>` landmark with a skip-to-content link; a small `RouteFocus` client component moves focus to it on client-side navigation; each `<nav>` has a distinct `aria-label`; every route has exactly one `<h1>` (sr-only where the visible top heading is a card title/`<h2>`). Automated a11y uses **axe-core directly** (`src/test/axe.ts` + `a11y.test.tsx`) over key surfaces incl. the cart drawer, promo carousel, and account dropdown.
- **Why:** One landmark can't drift per-page; axe-core avoids matcher-lib peer churn. jsdom computes no layout/color, so `color-contrast` (and the page-level `region`/`landmark-one-main`/`page-has-heading-one` rules, which false-positive on isolated component renders) are disabled in the automated run — **contrast is instead verified out-of-band** via an in-browser axe/Lighthouse pass (documented limitation, not a silent skip). jsdom test shims (`matchMedia`, `IntersectionObserver`, `ResizeObserver`) live in `vitest.setup.ts`.

### D23 — Coverage: reported via v8, per-file threshold on the critical path
- **Alternatives:** A global coverage gate; no coverage tooling.
- **Decision:** `@vitest/coverage-v8` with `test:coverage`; **no global threshold** (much of the tree is intentionally presentational — charts, nav), but an **enforced per-file threshold on `checkout-state.ts`** (the step machine that prevents skipping to Review). Gap-fill prioritized real logic (checkout/onboarding state machines, `effectivePriceCents`) over trivial code.
- **Why:** A global gate on a UI-heavy app rewards testing presentational glue over logic; a targeted threshold protects the security-/correctness-critical path without that pressure.

### D24 — CWV enforced at code level (live Lighthouse out-of-band)
- **Decision:** Lighthouse needs a real Chrome (not reproducible in this headless env), so CWV is enforced structurally and documented in the README: hero image is the `preload`ed LCP element (product images stay lazy), `recharts` is code-split out of buyer routes, `next/font` + fixed-height wrappers + dimension-matched skeletons prevent CLS, and per-route `metadata`/`generateMetadata` + `metadataBase` cover SEO.
- **Why:** Honest, falsifiable, code-level guarantees beat an unrepeatable score; the live audit is a documented out-of-band step.

---

## Phase 7 — Marketplace UX overhaul (seller feedback)

### D25 — Design system: "Bazaar, refined"
- **Decision:** A warm Indian-marketplace aesthetic driven entirely by CSS variables — cream canvas, warm-ink text, **saffron primary**, magenta for deals, emerald for in-stock — with **Fraunces** (display) + **Manrope** (body) via `next/font`. Because every primitive (Button/Input/Card/charts) reads the tokens, re-tinting `globals.css` restyles the whole app at once. Added `Skeleton` + `Badge` primitives.
- **Why:** The prior UI was grayscale + Geist. Centralizing colour/type in tokens delivers a cohesive, distinctive look without touching every component.

### D26 — INR + India-only
- **Decision:** All prices render as ₹ via `formatINR` (`Intl` `en-IN`, integer paise). Totals use **18% GST** + ₹49 flat shipping (free over ₹500). Addresses are **India-locked** (country fixed) with an Indian **states** dropdown and 6-digit **PIN** validation. Test fixtures updated to Indian data.
- **Why:** The app targets an Indian audience; currency, tax, and address shape must match.

### D27 — Sellers are not buyers; catalog is seller-listed (realtime)
- **Decision:** `decideAuth` redirects a seller away from buyer shopping routes (`/`, `/products`, `/offers`, `/checkout`, `/orders`) to `/seller`. The buyer catalog is composed of seller-attributed listings (seller name + location shown on cards/detail); a real seller's new product appears to buyers immediately (shared in-memory `globalThis` store — realtime in-process).
- **Why:** One role per account (D12). "As soon as a seller lists a product, buyers see it" — satisfied in-process. **A real database (e.g. Supabase) is the production step** for cross-instance persistence/realtime; kept in-memory to honour the minimal-backend scope.

### D28 — User profiles + saved addresses + offers routes + cart stepper
- **Decision:** A user icon menu replaces the email; `/account` manages profile (name, gender, contact) + saved addresses (add/delete). A seller's profile name becomes their storefront name shown to buyers. Offers open on dedicated `/offers` + `/offers/[id]` routes (offer info + its products). Add-to-cart becomes a quantity stepper once an item is in the cart.
- **Why:** Direct seller feedback — richer identity, offer detail pages, and inline quantity control.
