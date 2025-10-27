// c3
import { type Failable, err, isErr, isSome, val } from '@c3-oss/functional'
import type { Logger } from '@c3-oss/logger'

// internal
import { VErrorAlreadyExists } from '~/infra/errors/index.js'
import { BaseUseCase } from '~application/usecase/base-usecase.js'

import type { CachePort } from '~application/port/cache.port.js'
import type { UserRepositoryPort } from '~application/port/index.js'

// ---------------------------------------------------------------------------------------------------------------------

export interface CreateUserUseCaseDeps {
  userRepository: UserRepositoryPort
  logger: Logger
  cache?: CachePort
}

export interface CreateUserParams {
  name: string
  email: string
}

export class CreateUserUseCase extends BaseUseCase {
  private readonly userRepository: UserRepositoryPort
  private readonly log: Logger

  public constructor(deps: CreateUserUseCaseDeps) {
    super()

    const { userRepository, logger } = deps
    this.invariant({ userRepository, logger })

    this.userRepository = userRepository
    this.log = logger.child({ usecase: 'CreateUserUseCase' })
  }

  public async execute(params: CreateUserParams): Promise<Failable<string>> {
    const { name, email } = params
    this.log.info({ email }, 'create user requested')

    /* ... */

    const existingUserResult = await this.userRepository.getByEmail(email)
    if (isErr(existingUserResult)) {
      this.log.warn({ email, error: existingUserResult.left }, 'failed to check if user exists')
      return existingUserResult
    }

    /* ... */

    const existingUserOption = val(existingUserResult)
    if (isSome(existingUserOption)) {
      this.log.warn({ email }, 'user already exists')
      return err(new VErrorAlreadyExists({ message: 'User with this email already exists' }))
    }

    /* ... */

    const createdResult = await this.userRepository.create({ name, email })
    if (isErr(createdResult)) {
      this.log.warn({ email, error: createdResult.left }, 'failed to create user')
      return createdResult
    }

    /* ... */

    this.log.info({ email, userId: createdResult.right }, 'user created successfully')
    return createdResult
  }
}
