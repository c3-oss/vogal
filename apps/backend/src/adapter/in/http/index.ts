// internal
import type { Server } from '~adapter/in/server.types.js'
import type { WiringContext } from '~adapter/in/shared/wiring.js'
import { createHTTPRouter } from './router.js'

// ---------------------------------------------------------------------------------------------------------------------

export async function registerHTTP(app: Server, ctx: WiringContext) {
  await app.register(createHTTPRouter(ctx))
}
