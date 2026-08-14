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
  },
})
