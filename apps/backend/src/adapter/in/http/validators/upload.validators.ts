// 3rd-party
import { z } from 'zod'

// ---------------------------------------------------------------------------------------------------------------------

export const UploadBodySchema = z.object({
  workspaceId: z.string().min(1),
})
