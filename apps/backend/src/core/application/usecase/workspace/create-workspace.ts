// c3
import { type Failable, err, isErr, isNone, val } from '@c3-oss/functional'
import type { Logger } from '@c3-oss/logger'

// internal
import { VErrorExternalServiceUnavailable, VErrorNotFound } from '~/infra/errors/index.js'
import type { UserRepositoryPort, VogalRepositoryPort, WorkspaceRepositoryPort } from '~application/port/index.js'
import { BaseUseCase } from '~application/usecase/base-usecase.js'

// ---------------------------------------------------------------------------------------------------------------------

export interface CreateWorkspaceUseCaseDeps {
  workspaceRepository: WorkspaceRepositoryPort
  userRepository: UserRepositoryPort
  repository: VogalRepositoryPort
  logger: Logger
}

export interface CreateWorkspaceParams {
  name: string
  userId: string
}

export class CreateWorkspaceUseCase extends BaseUseCase {
  private readonly workspaceRepository: WorkspaceRepositoryPort
  private readonly userRepository: UserRepositoryPort
  private readonly repository: VogalRepositoryPort
  private readonly log: Logger

  public constructor(deps: CreateWorkspaceUseCaseDeps) {
    super()

    const { workspaceRepository, userRepository, repository, logger } = deps
    this.invariant({ workspaceRepository, userRepository, repository, logger })

    this.workspaceRepository = workspaceRepository
    this.userRepository = userRepository
    this.repository = repository
    this.log = logger.child({ usecase: 'CreateWorkspaceUseCase' })
  }

  public async execute(params: CreateWorkspaceParams): Promise<Failable<string>> {
    const { name, userId } = params
    this.log.info({ name, userId }, 'create workspace requested')

    const userResult = await this.userRepository.get(userId)
    if (isErr(userResult)) {
      this.log.warn({ name, userId, error: userResult.left }, 'failed to load user before workspace creation')
      return userResult
    }

    const userOption = val(userResult)
    if (isNone(userOption)) {
      this.log.warn({ name, userId }, 'user not found for workspace creation')
      return err(new VErrorNotFound({ message: 'User not found' }))
    }

    const createdResult = await this.workspaceRepository.create({ name, userId: userOption.value.id })
    if (isErr(createdResult)) {
      this.log.warn({ name, userId, error: createdResult.left }, 'failed to create workspace')
      return createdResult
    }

    const workspaceIdExt = val(createdResult)
    const initError = await this.repository.initCollection(workspaceIdExt)
    if (isNone(initError)) {
      this.log.info({ name, userId, workspaceIdExt }, 'workspace created successfully')
      return createdResult
    }

    this.log.warn({ name, userId, workspaceIdExt, error: initError.value }, 'failed to initialize workspace collection')

    // If the error is not already a VError, wrap it
    if (initError.value instanceof VErrorExternalServiceUnavailable) {
      return err(initError.value)
    }

    return err(
      new VErrorExternalServiceUnavailable({
        message: 'Failed to initialize workspace vector collection',
        context: { name, userId, workspaceIdExt },
      }),
    )
  }
}
