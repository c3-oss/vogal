// c3
import { type Failable, isErr, val } from '@c3-oss/functional'
import type { Logger } from '@c3-oss/logger'

// internal
import { BaseUseCase } from '~application/usecase/base-usecase.js'

import type { PaginatedResultDTO, PaginationQueryDTO, UserDTO } from '~application/dto/index.js'
import type { UserRepositoryPort } from '~application/port/index.js'

// ---------------------------------------------------------------------------------------------------------------------

export interface GetUsersUseCaseDeps {
  userRepository: UserRepositoryPort
  logger: Logger
}

export class GetUsersUseCase extends BaseUseCase {
  private readonly userRepository: UserRepositoryPort
  private readonly log: Logger

  public constructor(deps: GetUsersUseCaseDeps) {
    super()

    this.userRepository = deps.userRepository
    this.log = deps.logger.child({ usecase: 'GetUsersUseCase' })
  }

  public async execute(filters: PaginationQueryDTO = {}): Promise<Failable<PaginatedResultDTO<UserDTO>>> {
    this.log.debug({ filters }, 'list users requested')

    const result = await this.userRepository.getAll(filters)
    if (isErr(result)) {
      this.log.warn({ filters, error: result.left }, 'failed to list users')
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
      'list users completed',
    )
    return result
  }
}
