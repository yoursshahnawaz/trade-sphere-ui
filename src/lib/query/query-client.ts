import { QueryClient, isServer } from '@tanstack/react-query'

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

export function getQueryClient(): QueryClient {
  // Always a fresh client on the server so state never leaks between requests.
  if (isServer) return makeQueryClient()
  // Reuse one client in the browser across renders.
  browserQueryClient ??= makeQueryClient()
  return browserQueryClient
}
