// 3rd-party
import { z } from 'zod'

// internal
import { IdExtSchema, LimitSchema, PageSchema, buildOrderByEnum } from './common.js'

// ---------------------------------------------------------------------------------------------------------------------

const DocumentOrderFields = ['createdAt', 'filename', 'status'] as const
const DocumentOrderBySchema = buildOrderByEnum(DocumentOrderFields)

export const DocumentIdExtParamsSchema = z.object({
  idExt: IdExtSchema,
})

export const UpdateDocumentBodySchema = z.object({
  filename: z.string().min(1).max(255),
})

export const DocumentsListQuerySchema = z
  .object({
    workspaceId: IdExtSchema.optional(),
    limit: LimitSchema,
    page: PageSchema,
    orderBy: DocumentOrderBySchema.optional().default('-createdAt'),
  })
  .transform(({ workspaceId, limit, page, orderBy }) => {
    const isDesc = Boolean(orderBy?.startsWith('-'))
    const field = orderBy ? orderBy.replace(/^-/i, '') : 'createdAt'
    const orderField = field as (typeof DocumentOrderFields)[number]
    const orderDirection = (isDesc ? 'desc' : 'asc') as 'asc' | 'desc'
    return { workspaceId, limit, page, orderField, orderDirection }
  })
