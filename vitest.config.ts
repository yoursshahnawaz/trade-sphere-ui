import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    env: {
      SESSION_JWT_SECRET: 'test-secret-at-least-32-bytes-long-000000',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-project',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.*',
        'src/mocks/**',
        'src/test/**',
        'src/**/*.d.ts',
        'src/app/**/layout.tsx',
      ],
      // No global gate (much of the tree is presentational), but lock down the
      // security-/correctness-critical step machine so regressions surface.
      thresholds: {
        'src/features/checkout/checkout-state.ts': { statements: 85, branches: 75, functions: 100, lines: 85 },
      },
    },
  },
})
