// 3rd-party
import { z } from 'zod'

// internal
import { IdExtSchema } from './common.js'

// ---------------------------------------------------------------------------------------------------------------------

export const DocumentStatusParamsSchema = z.object({
  idExt: IdExtSchema,
})
