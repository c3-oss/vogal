// internal
import type { tableDocumentPages } from '~/adapter/out/db/model/schema.js'

// ---------------------------------------------------------------------------------------------------------------------

/** Complete document page data from database. */
export type DocumentPageDTO = typeof tableDocumentPages.$inferSelect
/** Data required to insert a document page. */
export type DocumentPageInsertDTO = typeof tableDocumentPages.$inferInsert

/** Basic document page information. */
export interface DocumentPageBasicInfoDTO {
  /** Page number. */
  pageNumber: number
  /** Text content of the page. */
  text: string
}
