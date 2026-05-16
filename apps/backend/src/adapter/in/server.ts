// 3rd-party
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import multipart from '@fastify/multipart'
import Fastify from 'fastify'

// c3
import type { Logger } from '@c3-oss/logger'

// internal
import type { WiringContext } from '~adapter/in/shared/index.js'
import { buildContext } from '~adapter/in/shared/wiring.js'
import { registerHTTP } from '~in/http/index.js'
import { errorHandler } from '~in/http/middlewares/error-handler.js'
import { registerTRPC } from '~in/trpc/index.js'
import { env } from '~infra/config/env.js'
import { runBeforeExit } from '~infra/signal.js'
import type { Server } from './server.types.js'

// ---------------------------------------------------------------------------------------------------------------------

const setupExitHandlers = (server: Server, context: WiringContext, log: Logger) => {
  const closeHttpServer = async () => {
    log.info('Closing HTTP server')
    await server.close()
  }

  const closeRedisClient = async () => {
    if (context.cache) {
      log.info('Closing Redis client')
      await context.cache.close()
    }
  }

  runBeforeExit({ actions: [closeHttpServer, closeRedisClient] })
}

export const exec = async (log: Logger) => {
  const serverLog = log.child({ module: 'server' })
  const context = await buildContext(serverLog)

  // tRPC upload sends the PDF as base64-encoded JSON. Base64 inflates payloads by ~33%,
  // plus JSON wrapping/field overhead, so the Fastify body limit must exceed the raw file
  // limit by a safe margin.
  const bodyLimit = Math.ceil(env.HTTP_FILE_SIZE_LIMIT * 1.4) + 1024 * 1024
  const app = Fastify({ loggerInstance: serverLog, bodyLimit }) as Server

  await app.register(helmet)
  await app.register(cors, { origin: env.HTTP_CORS_ORIGIN, credentials: true })
  await app.register(multipart, { limits: { fileSize: env.HTTP_FILE_SIZE_LIMIT } })

  await registerHTTP(app, context)
  await registerTRPC(app, context, serverLog)

  app.setErrorHandler(errorHandler)

  await app.listen({ port: env.HTTP_PORT, host: env.HTTP_HOST })
  serverLog.info({ port: env.HTTP_PORT, host: env.HTTP_HOST }, 'Vogal server running')

  setupExitHandlers(app, context, serverLog)
}
