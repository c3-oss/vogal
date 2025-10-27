import { QueryClient } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import superjson from 'superjson'

import { env } from '../env.js'
import { trpc } from '../trpc.js'

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: env.VITE_API_URL,
        transformer: superjson,
      }),
    ],
  })
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
