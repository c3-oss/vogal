// c3
import { type Failable, err, isErr, isNone, isSome, ok, val } from '@c3-oss/functional'
import type { Logger } from '@c3-oss/logger'

// internal
import { VErrorAlreadyExists, VErrorInvalidInput, VErrorNotFound } from '~/infra/errors/index.js'
import { BaseUseCase } from '~application/usecase/base-usecase.js'

import type { UserDTO, UserUpdateDTO } from '~application/dto/index.js'
import type { UserRepositoryPort } from '~application/port/index.js'

// ---------------------------------------------------------------------------------------------------------------------

export interface UpdateUserUseCaseDeps {
  userRepository: UserRepositoryPort
  logger: Logger
}

export interface UpdateUserParams extends UserUpdateDTO {
  idExt: string
}

export class UpdateUserUseCase extends BaseUseCase {
  private readonly userRepository: UserRepositoryPort
  private readonly log: Logger

  public constructor(deps: UpdateUserUseCaseDeps) {
    super()

    const { userRepository, logger } = deps
    this.invariant({ userRepository, logger })

    this.userRepository = userRepository
    this.log = logger.child({ usecase: 'UpdateUserUseCase' })
  }

  public async execute(params: UpdateUserParams): Promise<Failable<UserDTO>> {
    const { idExt, name, email } = params
    this.log.info({ idExt }, 'update user requested')

    if (typeof name === 'undefined' && typeof email === 'undefined') {
      return err(new VErrorInvalidInput({ message: 'No fields provided for update' }))
    }

    const userResult = await this.userRepository.get(idExt)
    if (isErr(userResult)) {
      this.log.warn({ idExt, error: userResult.left }, 'failed to load user before update')
      return userResult
    }

    const userOption = val(userResult)
    if (isNone(userOption)) {
      this.log.warn({ idExt }, 'user not found for update')
      return err(new VErrorNotFound({ message: 'User not found' }))
    }

    const existing = userOption.value
    const updates: UserUpdateDTO = {}
    let hasChanges = false

    if (typeof name !== 'undefined' && name !== existing.name) {
      updates.name = name
      hasChanges = true
    }

    if (typeof email !== 'undefined' && email !== existing.email) {
      const emailResult = await this.userRepository.getByEmail(email)
      if (isErr(emailResult)) {
        this.log.warn({ idExt, email, error: emailResult.left }, 'failed to check email uniqueness')
        return emailResult
      }

      const emailOption = val(emailResult)
      if (isSome(emailOption) && emailOption.value.idExt !== existing.idExt) {
        this.log.warn({ idExt, email }, 'email already in use by another user')
        return err(new VErrorAlreadyExists({ message: 'User with this email already exists' }))
      }

      updates.email = email
      hasChanges = true
    }

    if (!hasChanges) {
      this.log.info({ idExt }, 'no changes detected for user update')
      return ok(existing)
    }

    const updateResult = await this.userRepository.update(idExt, updates)
    if (isErr(updateResult)) {
      this.log.warn({ idExt, error: updateResult.left }, 'failed to update user')
      return updateResult
    }

    const updatedOption = val(updateResult)
    if (isNone(updatedOption)) {
      this.log.warn({ idExt }, 'user not found during update persistence')
      return err(new VErrorNotFound({ message: 'User not found' }))
    }

    this.log.info({ idExt }, 'user updated successfully')
    return ok(updatedOption.value)
  }
}
