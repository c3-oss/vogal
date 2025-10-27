// 3rd-party
import type { FastifyReply as Reply, FastifyRequest as Request } from 'fastify'

// internal
import { BaseController } from '~/adapter/in/http/common/base-controller.js'
import type { Jsonifiable } from '~infra/contracts.js'
import type { GetHealthStatusUseCase } from '~usecase/health/get-health-status.js'

// ---------------------------------------------------------------------------------------------------------------------

interface HealthControllerDeps {
  getHealthStatus: GetHealthStatusUseCase
}

export class HealthController extends BaseController {
  private readonly getHealthStatus: GetHealthStatusUseCase

  public constructor(deps: HealthControllerDeps) {
    super()
    const { getHealthStatus } = deps
    this.invariant({ getHealthStatus })

    this.getHealthStatus = getHealthStatus
  }

  public async handle(_req: Request, res: Reply): Promise<void> {
    const health = await this.getHealthStatus.execute()
    const statusCode = health.status === 'ok' ? 200 : 503
    this.sendResponse(res, statusCode, health as unknown as Jsonifiable)
  }
}
