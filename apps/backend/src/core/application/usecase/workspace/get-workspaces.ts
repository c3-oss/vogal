// c3
import { type Failable, isErr, val } from '@c3-oss/functional'
import type { Logger } from '@c3-oss/logger'

// internal
import type { PaginatedResultDTO, PaginationQueryDTO, WorkspaceDTO } from '~application/dto/index.js'
import type { WorkspaceRepositoryPort } from '~application/port/index.js'
import { BaseUseCase } from '~application/usecase/base-usecase.js'

// ---------------------------------------------------------------------------------------------------------------------

export interface GetWorkspacesUseCaseDeps {
  workspaceRepository: WorkspaceRepositoryPort
  logger: Logger
}

export class GetWorkspacesUseCase extends BaseUseCase {
  private readonly workspaceRepository: WorkspaceRepositoryPort
  private readonly log: Logger

  public constructor(deps: GetWorkspacesUseCaseDeps) {
    super()

    const { workspaceRepository, logger } = deps
    this.invariant({ workspaceRepository, logger })

    this.workspaceRepository = workspaceRepository
    this.log = logger.child({ usecase: 'GetWorkspacesUseCase' })
  }

  public async execute(filters: PaginationQueryDTO = {}): Promise<Failable<PaginatedResultDTO<WorkspaceDTO>>> {
    this.log.debug({ filters }, 'list workspaces requested')

    const result = await this.workspaceRepository.getAll(filters)
    if (isErr(result)) {
      this.log.warn({ filters, error: result.left }, 'failed to list workspaces')
      return result
    }

    const paginated = val(result)
    this.log.debug(
      {
        filters,
        totalResults: paginated.meta.totalResults,
        currentPage: paginated.meta.currentPage,
        totalPages: paginated.meta.totalPages,
      },
      'list workspaces completed',
    )
    return result
  }
}
