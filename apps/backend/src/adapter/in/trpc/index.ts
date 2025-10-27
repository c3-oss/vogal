// c3
import type { Logger } from '@c3-oss/logger'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'

// internal
import type { Server } from '~adapter/in/server.types.js'
import type { WiringContext } from '~adapter/in/shared/wiring.js'
import { createAppRouter } from './router.js'

// ---------------------------------------------------------------------------------------------------------------------

export type { AppRouter } from './router.js'

export async function registerTRPC(app: Server, ctx: WiringContext, log: Logger) {
  const router = createAppRouter({ ...ctx, log })
  await app.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: { router, createContext: () => ({}) },
  })
}
