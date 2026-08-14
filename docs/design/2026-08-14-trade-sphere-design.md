# Trade-Sphere UI — Design Specification

**Date:** 2026-08-14
**Status:** Approved (baseline)
**Source requirements:** `PROBLEM_STATEMENT.md`, `IMPLEMENTATION_DETAILS.md`, `CODING_GUIDELINES.md`

This spec supersedes `IMPLEMENTATION_DETAILS.md` at the load-bearing joints (auth/session/middleware, state ownership, dependencies) while preserving its overall phased shape — with a dedicated foundation phase (Phase 0) added and checkout split into its own phase. Rationale for each material change is recorded in `DECISIONS.md`.

---

## 1. Objective
A multi-vendor e-commerce marketplace **frontend** (Next.js App Router + TypeScript) serving two personas:

- **Buyer** — targeted promo carousel, guest→auth mergeable persistent cart, smart auth routing (intent capture + redirect), infinite catalog with faceted search, product detail, multi-step checkout.
- **Seller** — protected portal with analytics dashboard, sortable/filterable inventory table, multi-step product onboarding with drag-and-drop image upload.

Under strict non-functional bars: Core Web Vitals (LCP < 2.5s, CLS < 0.1, INP < 200ms), HTTP-only cookie sessions (no token in `localStorage`/`sessionStorage`), resilient error handling, WAI-ARIA accessibility, and unit + integration test coverage.

## 2. Stack
| Concern | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript (strict) |
| Identity | Firebase Auth (client sign-in) + `firebase-admin` (server session) |
| Client state | Redux Toolkit (`cart`, `auth`, `ui`) + `createListenerMiddleware` |
| Server cache | TanStack Query (catalog, product, analytics, orders) |
| Forms / validation | react-hook-form + Zod (shared schemas) |
| UI | shadcn/ui (Radix primitives) + Tailwind CSS |
| Charts / carousel | recharts, embla-carousel-react |
| Errors | react-error-boundary |
| Testing | Vitest + Testing Library + MSW (optional Playwright happy-path) |
| Package manager | npm |

## 3. Architecture

### 3.1 Identity & session (security-critical)
1. User signs in via the **Firebase client SDK**; the client is **not** depended on to hold a session — the cookie is the source of truth.
2. Client sends the Firebase **ID token** to `POST /api/auth/session`.
3. That handler runs in the **Node runtime**, verifies the ID token with `firebase-admin`, mints a **session cookie** via `createSessionCookie`, and sets it **HttpOnly + Secure + SameSite=Lax**. It returns a non-sensitive profile (`uid`, `email`, `role`).
4. **Edge middleware** guards `/seller/*` and `/checkout`: it performs an Edge-safe **presence check** of the session cookie. If absent → redirect to `/login?returnUrl=<path>` (**intent capture**). After login we parse `returnUrl` and route the user back (**seamless redirect**).
5. **Full cryptographic verification** (`verifySessionCookie`) and **role checks** happen in the **server layer** (server components / route handlers) where data is accessed — because `firebase-admin` cannot run on the Edge runtime.
6. **Logout:** `DELETE /api/auth/session` clears the cookie server-side; the client signs out of Firebase and we clear `cartSlice` + invalidate profile/order query caches.

Roles: two seeded demo accounts (buyer + seller); role carried via a Firebase **custom claim** (fallback: mock user record keyed by `uid`).

### 3.2 Data layer — in-app BFF
Next.js **route handlers act as a mock BFF** over in-memory / JSON seed data (products, cart, orders, seller analytics). This is a genuine server layer (already running `firebase-admin`), not a stub. Server code is bounded in `src/lib/server/` + `src/app/api/` so it could later be extracted into a standalone service. **Zod schemas are shared** between the client (validate before submit) and the handlers (validate before "persist"). **MSW** intercepts the same routes in tests.

### 3.3 State ownership
- **Redux Toolkit = client state:** `cartSlice` (items + optimistic add-to-cart + guest persistence), `authSlice` (non-sensitive status), `uiSlice` (drawers/modals). Cart merge on login and teardown on logout are driven by `createListenerMiddleware`.
- **TanStack Query = server cache:** catalog (`useInfiniteQuery`), product detail, seller analytics, orders. **The cart is not a Query.**
- **Guest cart** persists to `localStorage` via a small store subscription (no `redux-persist`). Cart data is non-sensitive, so this complies with the security rules.

### 3.4 UI & resilience
shadcn/ui (Radix) provides accessible Dialog/Drawer/Dropdown/Tabs (focus traps, `aria-expanded`, keyboard). `next/image` (AVIF/WebP, `priority` hero) + dimension-matched skeletons prevent CLS/LCP regressions. `react-error-boundary` wraps layout sections and each data-fetching segment so an isolated failure can't crash the app; fallbacks offer retry.

## 4. Directory structure
```
src/
  app/                    # routes, layouts, route handlers (/api/*)
  middleware.ts           # edge presence-check + intent capture
  components/ui/          # shadcn primitives
  components/             # shared app components
  features/
    auth/                 # authClient seam, session hooks, auth-slice
    cart/                 # cart-slice, merge/teardown listeners, optimistic
    catalog/              # infinite query, product-card, filters
    checkout/             # multi-step wizard
    seller/               # dashboard, inventory-table, product-onboarding
  lib/{schemas,server,query}/   # zod schemas, firebase-admin, query client
  store/                  # configureStore + listener middleware
  types/                  # domain entities
  mocks/                  # MSW handlers + seed data (shared with route handlers)
```
All files/dirs **kebab-case**. Firebase is wrapped behind an **`authClient` seam** so the auth flow is testable (SDK calls don't go through fetch/MSW).

## 5. Phased delivery (sequential; `main` is the integration branch)
| Phase | Branch | Delivers | PR gate |
|---|---|---|---|
| 0 — Foundation | `feat/phase-0-foundation` | scaffold, TS strict, Tailwind+shadcn, RTK+Query providers, root ErrorBoundary, MSW+Vitest, seed data, docs skeleton | build + typecheck + lint + tests green |
| 1 — Auth & routing *(de-risk first)* | `feat/phase-1-auth` | Firebase client, session-cookie exchange, middleware intent-capture/redirect, login/register, logout | protected route redirects + returns correctly |
| 2 — Cart & merging | `feat/phase-2-cart` | guest cart, login-merge, logout-teardown, optimistic add | merge/teardown unit tests pass |
| 3 — Buyer & perf | `feat/phase-3-buyer` | promo carousel + targeting, infinite catalog + skeletons, product detail, image opt, segment error boundaries | catalog + carousel keyboard-operable |
| 4 — Checkout | `feat/phase-4-checkout` | Cart→Shipping→Billing→Review wizard, Zod step validation | checkout integration test (MSW) passes |
| 5 — Seller portal | `feat/phase-5-seller` | protected workspace, recharts analytics, inventory table (sort/filter/status), 3-step onboarding + drag-drop upload | onboarding validation + table tests pass |
| 6 — Hardening | `feat/phase-6-hardening` | a11y sweep (live regions, focus mgmt), Lighthouse/CWV audit, coverage fill, docs finalize | LCP<2.5s / CLS<0.1 locally, a11y checks |

Each phase: branch → implement (TDD on domain logic) → docs update → PR via `gh` → merge → next.

## 6. Testing & quality gates
- **Unit:** cart-merge math/dedup, Zod schemas, inventory status derivation, tax/total calculations.
- **Integration:** checkout funnel + product onboarding via DOM events with MSW-simulated failures — verifying optimistic rollback and error-boundary fallbacks.
- **Optional E2E:** one Playwright happy-path (checkout) in Phase 6 if time allows.
- Every PR gated on `typecheck + lint + test`.

## 7. Living documentation
- **DECISIONS.md** — one entry per non-obvious choice (decision / alternatives / why).
- **PROGRESS.md** — phase status table with PR links, updated at each phase boundary.
- **CODING_GUIDELINES.md** — engineering standards (extended with directory map, RSC discipline, accessible primitives, commit conventions).

## 8. Explicitly out of scope
Real payment processing, real product database, email/notifications, real image CDN uploads (previews only via `URL.createObjectURL`), multi-currency, and deployment infrastructure. These are stubbed or mocked to keep focus on the frontend engineering the assessment targets.
