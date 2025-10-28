// 3rd-party
import { z } from 'zod'

// internal
import { IdExtSchema, LimitSchema, PageSchema, buildOrderByEnum } from './common.js'

// ---------------------------------------------------------------------------------------------------------------------

export const CreateWorkspaceBodySchema = z.object({
  name: z.string().min(1).max(100),
  userId: z.string().min(1),
})

export const UpdateWorkspaceBodySchema = z.object({
  name: z.string().min(1).max(100),
})

export const WorkspaceIdExtParamsSchema = z.object({
  idExt: IdExtSchema,
})

export const UserIdParamsSchema = z.object({
  userId: z.string().min(1),
})

const WorkspaceOrderFields = ['createdAt', 'name'] as const
const WorkspaceOrderBySchema = buildOrderByEnum(WorkspaceOrderFields)

export const ListWorkspacesQuerySchema = z
  .object({
    limit: LimitSchema,
    page: PageSchema,
    orderBy: WorkspaceOrderBySchema.optional().default('-createdAt'),
  })
  .transform(({ limit, page, orderBy }) => {
    const isDesc = Boolean(orderBy?.startsWith('-'))
    const field = orderBy ? orderBy.replace(/^-/i, '') : 'createdAt'
    const orderField = field as (typeof WorkspaceOrderFields)[number]
    const orderDirection = isDesc ? 'desc' : 'asc'
    return { limit, page, orderField, orderDirection }
  })
