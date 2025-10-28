// 3rd-party
import { z } from 'zod'

// internal
import { IdExtSchema, LimitSchema, PageSchema, buildOrderByEnum } from './common.js'

// ---------------------------------------------------------------------------------------------------------------------

export const CreateUserBodySchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
})

export const UpdateUserBodySchema = CreateUserBodySchema.partial().refine(
  (data) => typeof data.name !== 'undefined' || typeof data.email !== 'undefined',
  { message: 'At least one field must be provided to update the user' },
)

export const UserIdExtParamsSchema = z.object({
  idExt: IdExtSchema,
})

const UserOrderFields = ['createdAt', 'name', 'email'] as const
const UserOrderBySchema = buildOrderByEnum(UserOrderFields)

export const ListUsersQuerySchema = z
  .object({
    limit: LimitSchema,
    page: PageSchema,
    orderBy: UserOrderBySchema.optional().default('-createdAt'),
  })
  .transform(({ limit, page, orderBy }) => {
    const isDesc = Boolean(orderBy?.startsWith('-'))
    const field = orderBy ? orderBy.replace(/^-/i, '') : 'createdAt'
    const orderField = field as (typeof UserOrderFields)[number]
    const orderDirection = (isDesc ? 'desc' : 'asc') as 'asc' | 'desc'
    return { limit, page, orderField, orderDirection }
  })
