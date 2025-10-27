// c3
import { type Failable, err, isErr, isNone, ok, val } from '@c3-oss/functional'
import type { Logger } from '@c3-oss/logger'

// internal
import { VErrorInvalidInput, VErrorNotFound } from '~/infra/errors/index.js'
import type { WorkspaceDTO, WorkspaceUpdateDTO } from '~application/dto/index.js'
import type { WorkspaceRepositoryPort } from '~application/port/index.js'
import { BaseUseCase } from '~application/usecase/base-usecase.js'

// ---------------------------------------------------------------------------------------------------------------------

export interface UpdateWorkspaceUseCaseDeps {
  workspaceRepository: WorkspaceRepositoryPort
  logger: Logger
}

export interface UpdateWorkspaceParams extends WorkspaceUpdateDTO {
  idExt: string
}

export class UpdateWorkspaceUseCase extends BaseUseCase {
  private readonly workspaceRepository: WorkspaceRepositoryPort
  private readonly log: Logger

  public constructor(deps: UpdateWorkspaceUseCaseDeps) {
    super()

    const { workspaceRepository, logger } = deps
    this.invariant({ workspaceRepository, logger })

    this.workspaceRepository = workspaceRepository
    this.log = logger.child({ usecase: 'UpdateWorkspaceUseCase' })
  }

  public async execute(params: UpdateWorkspaceParams): Promise<Failable<WorkspaceDTO>> {
    const { idExt, name } = params
    this.log.info({ idExt }, 'update workspace requested')

    if (typeof name === 'undefined' || name.length === 0) {
      return err(new VErrorInvalidInput({ message: 'Workspace name is required' }))
    }

    const workspaceResult = await this.workspaceRepository.get(idExt)
    if (isErr(workspaceResult)) {
      this.log.warn({ idExt, error: workspaceResult.left }, 'failed to load workspace before update')
      return workspaceResult
    }

    const workspaceOption = val(workspaceResult)
    if (isNone(workspaceOption)) {
      this.log.warn({ idExt }, 'workspace not found for update')
      return err(new VErrorNotFound({ message: 'Workspace not found' }))
    }

    const existing = workspaceOption.value
    if (name === existing.name) {
      this.log.info({ idExt }, 'workspace name unchanged, skipping update')
      return ok(existing)
    }

    const updateResult = await this.workspaceRepository.update(idExt, { name })
    if (isErr(updateResult)) {
      this.log.warn({ idExt, error: updateResult.left }, 'failed to update workspace')
      return updateResult
    }

    const updatedOption = val(updateResult)
    if (isNone(updatedOption)) {
      this.log.warn({ idExt }, 'workspace not found during update persistence')
      return err(new VErrorNotFound({ message: 'Workspace not found' }))
    }

    this.log.info({ idExt }, 'workspace updated successfully')
    return ok(updatedOption.value)
  }
}
