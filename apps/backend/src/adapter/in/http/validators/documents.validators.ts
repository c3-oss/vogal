// 3rd-party
import { z } from 'zod'

// internal
import { IdExtSchema } from './common.js'

// ---------------------------------------------------------------------------------------------------------------------

const LimitSchema = z.coerce.number().int().positive().max(100).default(20)
const PageSchema = z.coerce.number().int().positive().default(1)
const DocumentOrderFields = ['filename', 'title', 'author', 'chunksCount'] as const
const DocumentOrderBySchema = ((): import('zod').ZodEnum<
  ['filename', 'title', 'author', 'chunksCount', '-filename', '-title', '-author', '-chunksCount']
> => {
  return z.enum(['filename', 'title', 'author', 'chunksCount', '-filename', '-title', '-author', '-chunksCount'])
})()

export const DocumentIdExtParamsSchema = z.object({
  idExt: IdExtSchema,
})

export const UpdateDocumentBodySchema = z.object({
  filename: z.string().min(1).max(255),
})

export const DocumentsListQuerySchema = z
  .object({
    workspaceId: IdExtSchema,
    limit: LimitSchema,
    page: PageSchema,
    orderBy: DocumentOrderBySchema.optional().default('-filename'),
  })
  .transform(({ workspaceId, limit, page, orderBy }) => {
    const isDesc = Boolean(orderBy?.startsWith('-'))
    const field = orderBy ? orderBy.replace(/^-/i, '') : 'filename'
    const orderField = field as (typeof DocumentOrderFields)[number]
    const orderDirection = (isDesc ? 'desc' : 'asc') as 'asc' | 'desc'
    return { workspaceId, limit, page, orderField, orderDirection }
  })
