// c3
import { type Option, isErr, isSome, none, some, val } from '@c3-oss/functional'
import type { Logger } from '@c3-oss/logger'
import { VErrorNotFound } from '~/infra/errors/custom/not-found.error.js'

// internal
import { BaseUseCase } from '~application/usecase/base-usecase.js'

import type { UserRepositoryPort } from '~application/port/user-repository.port.js'

// ---------------------------------------------------------------------------------------------------------------------

export interface DeleteUserUseCaseDeps {
  userRepository: UserRepositoryPort
  logger: Logger
}

export interface DeleteUserParams {
  idExt: string
}

export class DeleteUserUseCase extends BaseUseCase {
  private readonly userRepository: UserRepositoryPort
  private readonly log: Logger

  public constructor(deps: DeleteUserUseCaseDeps) {
    super()

    const { userRepository, logger } = deps
    this.invariant({ userRepository, logger })

    this.userRepository = userRepository
    this.log = logger.child({ usecase: 'DeleteUserUseCase' })
  }

  public async execute(params: DeleteUserParams): Promise<Option<Error>> {
    const { idExt } = params
    this.log.info({ idExt }, 'delete user requested')

    const userResult = await this.userRepository.get(idExt)
    if (isErr(userResult)) {
      this.log.warn({ idExt, error: userResult.left }, 'failed to load user before deletion')
      return some(userResult.left)
    }
    const user = val(userResult)

    if (!isSome(user)) {
      this.log.warn({ idExt }, 'user not found for deletion')
      return some(new VErrorNotFound({ message: 'User not found' }))
    }

    const deleteResult = await this.userRepository.delete(user.value.idExt)
    if (isSome(deleteResult)) {
      this.log.warn({ idExt, error: deleteResult.value }, 'failed to delete user')
      return deleteResult
    }

    this.log.info({ idExt }, 'user deleted successfully')
    return none
  }
}
