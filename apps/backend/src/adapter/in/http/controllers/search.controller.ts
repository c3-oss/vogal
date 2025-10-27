// 3rd-party
import type { FastifyReply as Reply, FastifyRequest as Request } from 'fastify'

// c3
import { isErr } from '@c3-oss/functional'

// internal
import { BaseController } from '~/adapter/in/http/common/base-controller.js'
import type { Jsonifiable } from '~infra/contracts.js'
import type { SearchUseCase } from '~usecase/document/search.js'
import { SearchQuerySchema } from '~validators/search.validators.js'

// ---------------------------------------------------------------------------------------------------------------------

interface SearchControllerDependencies {
  search: SearchUseCase
}

export class SearchController extends BaseController {
  private readonly search: SearchUseCase

  public constructor(deps: SearchControllerDependencies) {
    super()
    const { search } = deps
    this.invariant({ search })

    this.search = search
  }

  public async handle(req: Request, reply: Reply): Promise<void> {
    const parsed = SearchQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      throw parsed.error
    }

    /* ... */

    const result = await this.search.execute(parsed.data)
    if (isErr(result)) {
      throw result.left
    }

    this.sendResponse(reply, 200, { hits: result.right } as unknown as Jsonifiable)
  }
}
