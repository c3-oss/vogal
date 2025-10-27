// c3
import { type Failable, type Option, isErr, isNone, val } from '@c3-oss/functional'
import type { Logger } from '@c3-oss/logger'

// internal
import { BaseUseCase } from '~application/usecase/base-usecase.js'

import type { UserDTO } from '~application/dto/index.js'
import type { UserRepositoryPort } from '~application/port/index.js'

// ---------------------------------------------------------------------------------------------------------------------

export interface GetUserUseCaseDeps {
  userRepository: UserRepositoryPort
  logger: Logger
}

export interface GetUserParams {
  idExt: string
}

export class GetUserUseCase extends BaseUseCase {
  private readonly userRepository: UserRepositoryPort
  private readonly log: Logger

  public constructor(deps: GetUserUseCaseDeps) {
    super()

    const { userRepository, logger } = deps
    this.invariant({ userRepository, logger })

    this.userRepository = userRepository
    this.log = logger.child({ usecase: 'GetUserUseCase' })
  }

  public async execute(params: GetUserParams): Promise<Failable<Option<UserDTO>>> {
    const { idExt } = params
    this.log.debug({ idExt }, 'fetch user requested')

    const userResult = await this.userRepository.get(idExt)
    if (isErr(userResult)) {
      this.log.warn({ idExt, error: userResult.left }, 'failed to fetch user')
      return userResult
    }

    const userOption = val(userResult)
    if (isNone(userOption)) {
      this.log.debug({ idExt }, 'user not found')
    } else {
      this.log.debug({ idExt }, 'user retrieved')
    }
    return userResult
  }
}
