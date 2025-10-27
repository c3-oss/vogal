// c3
import { type Failable, type Option, isErr, isNone, val } from '@c3-oss/functional'
import type { Logger } from '@c3-oss/logger'

// internal
import type { WorkspaceDTO } from '~application/dto/index.js'
import type { WorkspaceRepositoryPort } from '~application/port/index.js'
import { BaseUseCase } from '~application/usecase/base-usecase.js'

// ---------------------------------------------------------------------------------------------------------------------

export interface GetWorkspaceUseCaseDeps {
  workspaceRepository: WorkspaceRepositoryPort
  logger: Logger
}

export interface GetWorkspaceParams {
  idExt: string
}

export class GetWorkspaceUseCase extends BaseUseCase {
  private readonly workspaceRepository: WorkspaceRepositoryPort
  private readonly log: Logger

  public constructor(deps: GetWorkspaceUseCaseDeps) {
    super()

    const { workspaceRepository, logger } = deps
    this.invariant({ workspaceRepository, logger })

    this.workspaceRepository = workspaceRepository
    this.log = logger.child({ usecase: 'GetWorkspaceUseCase' })
  }

  public async execute(params: GetWorkspaceParams): Promise<Failable<Option<WorkspaceDTO>>> {
    const { idExt } = params
    this.log.debug({ idExt }, 'fetch workspace requested')

    const workspaceResult = await this.workspaceRepository.get(idExt)
    if (isErr(workspaceResult)) {
      this.log.warn({ idExt, error: workspaceResult.left }, 'failed to fetch workspace')
      return workspaceResult
    }

    const workspaceOption = val(workspaceResult)
    if (isNone(workspaceOption)) {
      this.log.debug({ idExt }, 'workspace not found')
    } else {
      this.log.debug({ idExt }, 'workspace retrieved')
    }

    return workspaceResult
  }
}
