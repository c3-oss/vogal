// 3rd-party
import { z } from 'zod'

// internal
import { IdExtSchema, LimitSchema } from './common.js'

// ---------------------------------------------------------------------------------------------------------------------

export const SearchQuerySchema = z.object({
  query: z.string().min(1),
  limit: LimitSchema.optional(),
  documentId: IdExtSchema.optional(),
  workspaceId: IdExtSchema,
})
