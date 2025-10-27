// 3rd-party
import { initTRPC } from '@trpc/server'

// internal
import { SearchQuerySchema } from '~in/http/validators/search.validators.js'
import { rightOrThrow } from '../trpc-errors.js'
import type { RouterDeps } from '../types.js'

const t = initTRPC.context<Record<string, never>>().create()

export const searchRouter = (deps: RouterDeps) =>
  t.router({
    query: t.procedure.input(SearchQuerySchema).query(async ({ input }) => {
      const result = await deps.useCases.search.execute(input)
      return { hits: rightOrThrow(result) }
    }),
  })
