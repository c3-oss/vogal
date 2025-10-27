// 3rd-party
import type { FastifyReply as Reply, FastifyRequest as Request } from 'fastify'
import _ from 'lodash'

// c3
import { isErr, isNone, isSome, val } from '@c3-oss/functional'

// internal
import { BaseController } from '~/adapter/in/http/common/base-controller.js'
import { VErrorNotFound } from '~/infra/errors/index.js'
import {
  CreateUserBodySchema,
  ListUsersQuerySchema,
  UpdateUserBodySchema,
  UserIdExtParamsSchema,
} from '~validators/users.validators.js'

import type { PaginationQueryDTO, UserDTO } from '~application/dto/index.js'
import type { Jsonifiable } from '~infra/contracts.js'
import type { CreateUserUseCase } from '~usecase/user/create-user.js'
import type { DeleteUserUseCase } from '~usecase/user/delete-user.js'
import type { GetUserUseCase } from '~usecase/user/get-user.js'
import type { GetUsersUseCase } from '~usecase/user/get-users.js'
import type { UpdateUserUseCase } from '~usecase/user/update-user.js'

interface UsersControllerDependencies {
  createUser: CreateUserUseCase
  getUser: GetUserUseCase
  getUsers: GetUsersUseCase
  deleteUser: DeleteUserUseCase
  updateUser: UpdateUserUseCase
}

// ---------------------------------------------------------------------------------------------------------------------

export class UsersController extends BaseController {
  private readonly createUser: CreateUserUseCase
  private readonly getUser: GetUserUseCase
  private readonly getUsers: GetUsersUseCase
  private readonly deleteUser: DeleteUserUseCase
  private readonly updateUser: UpdateUserUseCase

  public constructor(deps: UsersControllerDependencies) {
    super()

    const { createUser, getUser, getUsers, deleteUser, updateUser } = deps
    this.invariant({ createUser, getUser, getUsers, deleteUser, updateUser })

    this.createUser = createUser
    this.getUser = getUser
    this.getUsers = getUsers
    this.deleteUser = deleteUser
    this.updateUser = updateUser
  }

  private filterUserData(user: UserDTO): Jsonifiable {
    return { id: user.idExt, ..._.pick(user, ['name', 'email']) }
  }

  public async create(req: Request, reply: Reply): Promise<void> {
    const parsed = CreateUserBodySchema.safeParse(req.body)
    if (!parsed.success) {
      throw parsed.error
    }

    /* ... */

    const idResult = await this.createUser.execute(parsed.data)
    if (isErr(idResult)) {
      throw idResult.left
    }

    this.sendResponse(reply, 201, { id: idResult.right })
  }

  public async getAll(req: Request, reply: Reply): Promise<void> {
    const parsed = ListUsersQuerySchema.safeParse(req.query ?? {})
    if (!parsed.success) {
      throw parsed.error
    }

    /* ... */

    const { orderField, orderDirection, limit, page } = parsed.data as PaginationQueryDTO
    const result = await this.getUsers.execute({ limit, page, orderField, orderDirection })
    if (isErr(result)) {
      throw result.left
    }

    /* ... */

    const { meta, items } = val(result)
    this.sendResponse(reply, 200, {
      meta,
      items: items.map(this.filterUserData),
    } as unknown as Jsonifiable)
  }

  public async getOne(req: Request, reply: Reply): Promise<void> {
    const parsed = UserIdExtParamsSchema.safeParse(req.params)
    if (!parsed.success) {
      throw parsed.error
    }

    /* ... */

    const userResult = await this.getUser.execute(parsed.data)
    if (isErr(userResult)) {
      throw userResult.left
    }

    /* ... */

    const userOption = val(userResult)
    if (isNone(userOption)) {
      throw new VErrorNotFound({ message: 'User not found' })
    }

    this.sendResponse(reply, 200, this.filterUserData(userOption.value))
  }

  public async delete(req: Request, reply: Reply): Promise<void> {
    const parsed = UserIdExtParamsSchema.safeParse(req.params)
    if (!parsed.success) {
      throw parsed.error
    }

    /* ... */

    const result = await this.deleteUser.execute(parsed.data)
    if (isSome(result)) {
      throw result.value
    }

    this.sendResponse(reply, 204)
  }

  public async update(req: Request, reply: Reply): Promise<void> {
    const params = UserIdExtParamsSchema.safeParse(req.params)
    if (!params.success) {
      throw params.error
    }

    /* ... */

    const body = UpdateUserBodySchema.safeParse(req.body ?? {})
    if (!body.success) {
      throw body.error
    }

    /* ... */

    const result = await this.updateUser.execute({ idExt: params.data.idExt, ...body.data })
    if (isErr(result)) {
      throw result.left
    }

    this.sendResponse(reply, 200, this.filterUserData(result.right))
  }
}
