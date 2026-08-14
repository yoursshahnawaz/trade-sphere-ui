'use client'

import { useRef, type ReactNode } from 'react'
import { Provider } from 'react-redux'
import { QueryClientProvider } from '@tanstack/react-query'
import { makeStore, type AppStore } from '@/store'
import { getQueryClient } from '@/lib/query/query-client'

export interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps): ReactNode {
  const storeRef = useRef<AppStore | null>(null)
  if (storeRef.current === null) {
    storeRef.current = makeStore()
  }

  return (
    <Provider store={storeRef.current}>
      <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>
    </Provider>
  )
}
