// standard
import type { Server as HttpServer } from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'

// 3rd-party
import type { FastifyInstance, FastifyTypeProviderDefault } from 'fastify'

// c3
import type { Logger } from '@c3-oss/logger'

// ---------------------------------------------------------------------------------------------------------------------

export type Server = FastifyInstance<
  HttpServer<typeof IncomingMessage, typeof ServerResponse>,
  IncomingMessage,
  ServerResponse<IncomingMessage>,
  Logger,
  FastifyTypeProviderDefault
>
