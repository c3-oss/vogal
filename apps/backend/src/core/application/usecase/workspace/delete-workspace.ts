// c3
import { type Option, isErr, isNone, isSome, none, some, val } from '@c3-oss/functional'
import type { Logger } from '@c3-oss/logger'
import { VErrorNotFound } from '~/infra/errors/index.js'

// internal
import type { VogalRepositoryPort, WorkspaceRepositoryPort } from '~application/port/index.js'
import { BaseUseCase } from '~application/usecase/base-usecase.js'

// ---------------------------------------------------------------------------------------------------------------------

export interface DeleteWorkspaceUseCaseDeps {
  workspaceRepository: WorkspaceRepositoryPort
  repository: VogalRepositoryPort
  logger: Logger
}

export interface DeleteWorkspaceParams {
  idExt: string
}

export class DeleteWorkspaceUseCase extends BaseUseCase {
  private readonly workspaceRepository: WorkspaceRepositoryPort
  private readonly repository: VogalRepositoryPort
  private readonly log: Logger

  public constructor(deps: DeleteWorkspaceUseCaseDeps) {
    super()

    const { workspaceRepository, repository, logger } = deps
    this.invariant({ workspaceRepository, repository, logger })

    this.workspaceRepository = workspaceRepository
    this.repository = repository
    this.log = logger.child({ usecase: 'DeleteWorkspaceUseCase' })
  }

  public async execute(params: DeleteWorkspaceParams): Promise<Option<Error>> {
    const { idExt } = params
    this.log.info({ idExt }, 'delete workspace requested')

    const workspaceResult = await this.workspaceRepository.get(idExt)
    if (isErr(workspaceResult)) {
      this.log.warn({ idExt, error: workspaceResult.left }, 'failed to load workspace before deletion')
      return some(workspaceResult.left)
    }
    const workspaceOption = val(workspaceResult)

    if (isNone(workspaceOption)) {
      this.log.warn({ idExt }, 'workspace not found for deletion')
      return some(new VErrorNotFound({ message: 'Workspace not found' }))
    }

    const delErr = await this.repository.deleteCollection(idExt)
    if (isSome(delErr)) {
      this.log.warn({ idExt, error: delErr.value }, 'failed to delete workspace collection')
      return delErr
    }

    const repoDeleteError = await this.workspaceRepository.delete(idExt)
    if (isSome(repoDeleteError)) {
      this.log.warn({ idExt, error: repoDeleteError.value }, 'failed to delete workspace record')
      return repoDeleteError
    }

    this.log.info({ idExt }, 'workspace deleted successfully')
    return none
  }
}
