// 3rd-party
import { initTRPC } from '@trpc/server'

// internal
import type { RouterDeps } from '../types.js'

// ---------------------------------------------------------------------------------------------------------------------

const t = initTRPC.context<Record<string, never>>().create()

export const healthRouter = (deps: RouterDeps) =>
  t.router({
    get: t.procedure.query(async () => {
      return await deps.useCases.getHealthStatus.execute()
    }),
  })
