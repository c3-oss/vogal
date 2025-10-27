// 3rd-party
import type { FastifyReply as Reply } from 'fastify'

// internal
import { BaseAdapter } from '~adapter/shared/base-adapter.js'
import type { Jsonifiable } from '~infra/contracts.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Base controller class providing common HTTP response functionality.
 * Extends BaseKernel for invariant checking capabilities.
 */
export abstract class BaseController extends BaseAdapter {
  protected sendResponse<T extends Jsonifiable>(res: Reply, statusCode: number, data?: T): void {
    res.status(statusCode).send(data)
  }
}
