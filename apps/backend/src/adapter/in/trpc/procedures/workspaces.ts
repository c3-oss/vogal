// 3rd-party
import { initTRPC } from '@trpc/server'
import { z } from 'zod'

// c3
import { isSome } from '@c3-oss/functional'

// internal
import {
  CreateWorkspaceBodySchema,
  ListWorkspacesQuerySchema,
  UpdateWorkspaceBodySchema,
  UserIdParamsSchema,
  WorkspaceIdExtParamsSchema,
} from '~in/http/validators/workspaces.validators.js'
import { rightOrThrow, someOrThrow } from '../trpc-errors.js'
import type { RouterDeps } from '../types.js'

// ---------------------------------------------------------------------------------------------------------------------

const t = initTRPC.context<Record<string, never>>().create()

export const workspacesRouter = (deps: RouterDeps) =>
  t.router({
    create: t.procedure.input(CreateWorkspaceBodySchema).mutation(async ({ input }) => {
      const idResult = await deps.useCases.createWorkspace.execute(input)
      return { id: rightOrThrow(idResult) }
    }),

    getAll: t.procedure.input(ListWorkspacesQuerySchema).query(async ({ input }) => {
      const { orderField, limit, page } = input
      const orderDirection = input.orderDirection as 'asc' | 'desc'
      const result = await deps.useCases.getWorkspaces.execute({ limit, page, orderField, orderDirection })
      const { meta, items } = rightOrThrow(result)
      return {
        meta,
        items: items.map((w) => ({ id: w.idExt, name: w.name })),
      }
    }),

    getOne: t.procedure.input(WorkspaceIdExtParamsSchema).query(async ({ input }) => {
      const workspaceResult = await deps.useCases.getWorkspace.execute(input)
      const w = someOrThrow(rightOrThrow(workspaceResult), 'Workspace not found')
      return { id: w.idExt, name: w.name }
    }),

    getByUser: t.procedure.input(UserIdParamsSchema).query(async ({ input }) => {
      const result = await deps.useCases.getWorkspacesByUser.execute(input)
      const list = rightOrThrow(result)
      return { workspaces: list.map((w) => ({ id: w.idExt, name: w.name })) }
    }),

    update: t.procedure
      .input(
        z.object({
          params: WorkspaceIdExtParamsSchema,
          body: UpdateWorkspaceBodySchema,
        }),
      )
      .mutation(async ({ input }) => {
        const result = await deps.useCases.updateWorkspace.execute({ idExt: input.params.idExt, ...input.body })
        const w = rightOrThrow(result)
        return { id: w.idExt, name: w.name }
      }),

    delete: t.procedure.input(WorkspaceIdExtParamsSchema).mutation(async ({ input }) => {
      const result = await deps.useCases.deleteWorkspace.execute(input)
      if (isSome(result)) throw result.value
      return null
    }),
  })
