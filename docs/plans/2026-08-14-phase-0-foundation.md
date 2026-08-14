# Phase 0 — Foundation Plan

> **Executor:** an agent with repo context. Compact by design — inline code only where non-obvious.
> **Do NOT push/PR/merge.** Phase ends by running the dev server for the user to verify live.

**Goal:** A working, tested Next.js App Router base: strict TS, Tailwind + shadcn/ui, Redux Toolkit + TanStack Query providers, a root error boundary, and a Vitest + MSW harness.

**Verified against (Aug 2026):** Next 16.3, shadcn CLI 4.18, react-error-boundary 6, MSW 2.15, react-redux 9, zod 4. TDD for real logic; scaffolding is verification-gated. Commands run in **Git Bash**. Conventional Commits, no AI attribution.

---

### Task 0 — Branch
```bash
git checkout -b feat/phase-0-foundation
```

### Task 1 — Scaffold into the existing repo
create-next-app won't run in a non-empty dir, so scaffold to a temp folder and move up. **Critical:** strip the temp `.git` first or it overwrites ours.
```bash
npx create-next-app@latest __scaffold --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --use-npm --skip-install --disable-git --yes
rm -rf __scaffold/.git            # keep OUR repo's .git
cp -r __scaffold/. .
rm -rf __scaffold
git branch --show-current         # MUST still print feat/phase-0-foundation
npm install
```
Verify: `npm run build` succeeds; `tsconfig.json` has `"@/*": ["./src/*"]`. (Turbopack is the Next 16 default — no flag needed. If a prompt appears, accept the default.) Commit: `chore: scaffold next.js app router + ts + tailwind`.

### Task 2 — Strict TS + scripts
Add to `tsconfig.json` compilerOptions: `"noUncheckedIndexedAccess": true`. Add scripts (keep generated `dev`/`build`/`start`/`lint` — the `lint` script is `eslint`, not `next lint`): `"typecheck": "tsc --noEmit"`, `"test": "vitest run"`, `"test:watch": "vitest"`.
Verify: `npm run typecheck` clean. Commit: `chore: strict ts + typecheck/test scripts`.

### Task 3 — Dependencies (only what Phase 0 uses)
```bash
npm i @reduxjs/toolkit react-redux @tanstack/react-query zod react-error-boundary
npm i -D vitest @vitejs/plugin-react vite-tsconfig-paths jsdom \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event msw
```
Commit: `chore: add phase 0 dependencies`.

### Task 4 — shadcn/ui
```bash
npx shadcn@latest init -d        # -d = defaults (neutral, skips all prompts). NOT --base-color.
npx shadcn@latest add button
```
Verify: `src/lib/utils.ts` (the `cn` helper) and `src/components/ui/button.tsx` exist; `npm run build` passes. Commit: `chore: init shadcn/ui + button`.

### Task 5 — Vitest harness
Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: { environment: 'jsdom', setupFiles: ['./vitest.setup.ts'] },
})
```
Create `vitest.setup.ts` (MSW added in Task 9):
```ts
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => cleanup())
```
Smoke test `src/lib/utils.test.ts`: assert `cn('px-2','px-4') === 'px-4'`. Verify `npm test` green. Commit: `test: vitest + testing-library harness`.

### Task 6 — Redux store (test-first)
- `src/store/ui-slice.ts` — `uiSlice` with `UiState { cartDrawerOpen: boolean }` (default `false`) and `setCartDrawerOpen(boolean)`. Test the reducer first (`ui-slice.test.ts`): default false, set true.
- `src/store/listener.ts` — `export const listenerMiddleware = createListenerMiddleware()`.
- `src/store/index.ts` — `makeStore()` with `reducer: { ui }` and `.prepend(listenerMiddleware.middleware)`; export types `AppStore`, `RootState`, `AppDispatch`.
- `src/store/hooks.ts` — typed `useAppDispatch`/`useAppSelector`/`useAppStore` via react-redux `.withTypes<...>()` (these factories are the sanctioned exception to the explicit-return-type rule).

Verify: `npm run typecheck && npm test`. Commit: `feat: redux store, listener middleware, typed hooks`.

### Task 7 — TanStack Query client
`src/lib/query/query-client.ts` — a per-environment singleton (fresh on server, reused in browser):
```ts
import { QueryClient, isServer } from '@tanstack/react-query'

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false } },
  })
}
let browserQueryClient: QueryClient | undefined
export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient()           // isServer boolean: deprecated but stable
  browserQueryClient ??= makeQueryClient()
  return browserQueryClient
}
```
Verify typecheck. Commit: `feat: tanstack query client factory`.

### Task 8 — Providers + root ErrorBoundary (test-first)
`src/components/error-boundary.tsx` — note the explicit return types and the `error` narrowing (v6 types `error` as `unknown`):
```tsx
'use client'
import type { ComponentType, ReactNode } from 'react'
import { ErrorBoundary as RB, type FallbackProps } from 'react-error-boundary'

function DefaultFallback({ error, resetErrorBoundary }: FallbackProps): ReactNode {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-md border p-4 text-sm">
      <p className="font-medium">Something went wrong.</p>
      <p className="text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
      <button type="button" onClick={resetErrorBoundary} className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground">Retry</button>
    </div>
  )
}
export interface ErrorBoundaryProps { children: ReactNode; fallback?: ComponentType<FallbackProps> }
export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps): ReactNode {
  return <RB FallbackComponent={fallback ?? DefaultFallback}>{children}</RB>
}
```
Test first (`error-boundary.test.tsx`, mock `console.error`): renders children normally; on a throwing child renders `role="alert"` + a Retry button.

`src/app/providers.tsx` — named props, explicit return type, SSR-safe store ref:
```tsx
'use client'
import { useRef, type ReactNode } from 'react'
import { Provider } from 'react-redux'
import { QueryClientProvider } from '@tanstack/react-query'
import { makeStore, type AppStore } from '@/store'
import { getQueryClient } from '@/lib/query/query-client'

export interface ProvidersProps { children: ReactNode }
export function Providers({ children }: ProvidersProps): ReactNode {
  const storeRef = useRef<AppStore | null>(null)
  if (storeRef.current === null) storeRef.current = makeStore()
  return (
    <Provider store={storeRef.current}>
      <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>
    </Provider>
  )
}
```
Edit `src/app/layout.tsx`: **keep the generated `RootLayout({ children }: LayoutProps<"/">)` signature untouched**; only wrap `{children}` with `<Providers><ErrorBoundary>{children}</ErrorBoundary></Providers>` and import both.
Verify: `npm run typecheck && npm test && npm run build`. Commit: `feat: providers + root error boundary`.

### Task 9 — MSW harness + health handler (test-first)
- `src/mocks/handlers.ts` — `http.get('/api/health', () => HttpResponse.json({ status: 'ok' }))`.
- `src/mocks/server.ts` — `export const server = setupServer(...handlers)` from `msw/node`.
- Replace `vitest.setup.ts` to add MSW lifecycle: `beforeAll(server.listen({ onUnhandledRequest: 'error' }))`, `afterEach(() => { cleanup(); server.resetHandlers() })`, `afterAll(server.close)`.
- Test `src/mocks/health.test.ts`: **`await fetch('/api/health')`** (relative — absolute URLs won't match the relative handler) → status 200, `body.status === 'ok'`.

Verify `npm test` all green. Commit: `test: msw server + health handler`.

### Task 10 — First schema + seed (test-first)
`src/lib/schemas/product-schema.ts` — Zod `productSchema` (`id`, `title` min 1, `priceCents` int ≥0, `stock` int ≥0, `category` min 1, `imageUrl: z.url()`) + `export type Product = z.infer<...>`. Test valid parse + rejects negative price / non-int stock / empty title.
`src/types/index.ts` — `export type { Product } from '@/lib/schemas/product-schema'`.
`src/mocks/seed/products.ts` — ~3 `Product` seed items (one out-of-stock).
Verify `npm run typecheck && npm test`. Commit: `feat: product schema, inferred type, seed`.

### Task 11 — Skeleton + landing page
```bash
mkdir -p src/features/{auth,cart,catalog,checkout,seller}
touch src/features/{auth,cart,catalog,checkout,seller}/.gitkeep
```
Replace `src/app/page.tsx` with a minimal landing (`export default function HomePage(): ReactNode`) rendering a title, one line of copy, and the shadcn `<Button>`.
Verify `npm run build`. Commit: `feat: feature-folder skeleton + landing page`.

### Task 12 — Gate + progress (STOP before push)
1. `npm run typecheck && npm run lint && npm test && npm run build` — all green.
2. `PROGRESS.md`: set Phase 0 status to **🟡 In progress** (legend: `✅ = Merged`; flip to ✅ only after the PR merges). Add a one-line log entry. Commit: `docs: phase 0 progress`.
3. `npm run dev` (foreground) → hand the local URL to the user for live verification.

**STOP.** After the user confirms, push `feat/phase-0-foundation` and open the PR against `main`.

---

**Coverage:** scaffold+strict TS (T1–2), Tailwind+shadcn (T1,4), RTK+Query providers (T6–8), root ErrorBoundary (T8), MSW+Vitest (T5,9), seed (T10), skeleton (T11), gate (T12). "Docs skeleton" from the spec is already satisfied by the existing DECISIONS/PROGRESS/CODING_GUIDELINES (which include the §8–11 extensions); T11 adds the code folder skeleton.
