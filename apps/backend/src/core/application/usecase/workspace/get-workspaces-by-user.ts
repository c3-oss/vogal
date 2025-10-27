// c3
import { type Failable, err, isErr, isNone, ok, val } from '@c3-oss/functional'
import type { Logger } from '@c3-oss/logger'

// internal
import { VErrorNotFound } from '~/infra/errors/index.js'
import type { WorkspaceDTO } from '~application/dto/index.js'
import type { UserRepositoryPort, WorkspaceRepositoryPort } from '~application/port/index.js'
import { BaseUseCase } from '~application/usecase/base-usecase.js'

// ---------------------------------------------------------------------------------------------------------------------

export interface GetWorkspacesByUserUseCaseDeps {
  workspaceRepository: WorkspaceRepositoryPort
  userRepository: UserRepositoryPort
  logger: Logger
}

export interface GetWorkspacesByUserParams {
  userId: string
}

export class GetWorkspacesByUserUseCase extends BaseUseCase {
  private readonly workspaceRepository: WorkspaceRepositoryPort
  private readonly userRepository: UserRepositoryPort
  private readonly log: Logger

  public constructor(deps: GetWorkspacesByUserUseCaseDeps) {
    super()

    const { workspaceRepository, userRepository, logger } = deps
    this.invariant({ workspaceRepository, userRepository, logger })

    this.workspaceRepository = workspaceRepository
    this.userRepository = userRepository
    this.log = logger.child({ usecase: 'GetWorkspacesByUserUseCase' })
  }

  public async execute(params: GetWorkspacesByUserParams): Promise<Failable<WorkspaceDTO[]>> {
    const { userId } = params
    this.log.debug({ userId }, 'list workspaces by user requested')

    const userResult = await this.userRepository.get(userId)
    if (isErr(userResult)) {
      this.log.warn({ userId, error: userResult.left }, 'failed to load user before listing workspaces')
      return userResult
    }

    if (isNone(val(userResult))) {
      this.log.warn({ userId }, 'user not found while listing workspaces')
      return err(new VErrorNotFound({ message: 'User not found' }))
    }

    const workspacesResult = await this.workspaceRepository.getByUser(userId)
    if (isErr(workspacesResult)) {
      this.log.warn({ userId, error: workspacesResult.left }, 'failed to list workspaces for user')
      return workspacesResult
    }

    const workspacesOption = val(workspacesResult)
    const workspaces = isNone(workspacesOption) ? [] : workspacesOption.value
    this.log.debug({ userId, total: workspaces.length }, 'list workspaces by user completed')
    return ok(workspaces)
  }
}
