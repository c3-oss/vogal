// 3rd-party
import { z } from 'zod'

// ---------------------------------------------------------------------------------------------------------------------

export const SearchQuerySchema = z.object({
  query: z.string().min(1),
  limit: z.coerce.number().int().positive().max(100).optional(),
  documentId: z.string().min(1).optional(),
  workspaceId: z.string().min(1),
})
