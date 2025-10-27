import { createTRPCReact } from '@trpc/react-query'

import type { AppRouter } from '@c3-oss/vogal-backend'

export const trpc = createTRPCReact<AppRouter>()

export type { AppRouter }
