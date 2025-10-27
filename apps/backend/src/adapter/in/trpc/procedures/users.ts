// 3rd-party
import { initTRPC } from '@trpc/server'
import { z } from 'zod'

// c3
import { isSome } from '@c3-oss/functional'

// internal
import {
  CreateUserBodySchema,
  ListUsersQuerySchema,
  UpdateUserBodySchema,
  UserIdExtParamsSchema,
} from '~in/http/validators/users.validators.js'
import { rightOrThrow, someOrThrow } from '../trpc-errors.js'
import type { RouterDeps } from '../types.js'

// ---------------------------------------------------------------------------------------------------------------------

const t = initTRPC.context<Record<string, never>>().create()

export const usersRouter = (deps: RouterDeps) =>
  t.router({
    create: t.procedure.input(CreateUserBodySchema).mutation(async ({ input }) => {
      const idResult = await deps.useCases.createUser.execute(input)
      return { id: rightOrThrow(idResult) }
    }),

    getAll: t.procedure.input(ListUsersQuerySchema).query(async ({ input }) => {
      const { orderField, orderDirection, limit, page } = input
      const result = await deps.useCases.getUsers.execute({ limit, page, orderField, orderDirection })
      const { meta, items } = rightOrThrow(result)
      return {
        meta,
        items: items.map((u) => ({ id: u.idExt, name: u.name, email: u.email })),
      }
    }),

    getOne: t.procedure.input(UserIdExtParamsSchema).query(async ({ input }) => {
      const userResult = await deps.useCases.getUser.execute(input)
      const u = someOrThrow(rightOrThrow(userResult), 'User not found')
      return { id: u.idExt, name: u.name, email: u.email }
    }),

    update: t.procedure
      .input(
        z.object({
          params: UserIdExtParamsSchema,
          body: UpdateUserBodySchema,
        }),
      )
      .mutation(async ({ input }) => {
        const result = await deps.useCases.updateUser.execute({ idExt: input.params.idExt, ...input.body })
        const u = rightOrThrow(result)
        return { id: u.idExt, name: u.name, email: u.email }
      }),

    delete: t.procedure.input(UserIdExtParamsSchema).mutation(async ({ input }) => {
      const result = await deps.useCases.deleteUser.execute(input)
      if (isSome(result)) throw result.value
      return null
    }),
  })
