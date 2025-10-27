// 3rd-party
import { z } from 'zod'

// ---------------------------------------------------------------------------------------------------------------------

export const IdExtSchema = z.string().min(1)
export const UserIdSchema = z.string().min(1)

const LimitSchema = z.coerce.number().int().positive().max(100).default(20)
const PageSchema = z.coerce.number().int().positive().default(1)
const OrderBySchema = z
  .string()
  .regex(/^-?[A-Za-z][A-Za-z0-9_]*$/)
  .optional()
  .default('-createdAt')

export const ListQuerySchema = z
  .object({
    limit: LimitSchema,
    page: PageSchema,
    orderBy: OrderBySchema,
  })
  .transform(({ limit, page, orderBy }) => {
    const isDesc = Boolean(orderBy?.startsWith('-'))
    const orderField = orderBy ? orderBy.replace(/^-/i, '') : 'createdAt'
    const orderDirection = isDesc ? 'desc' : 'asc'
    return { limit, page, orderField, orderDirection }
  })
