// internal
import type { tableDocuments } from '~/adapter/out/db/model/schema.js'

// ---------------------------------------------------------------------------------------------------------------------

/** Complete document data from database. */
export type DocumentDTO = typeof tableDocuments.$inferSelect
/** Data required to insert a new document. */
export type DocumentInsertDTO = typeof tableDocuments.$inferInsert
/** Data allowed for document updates. */
export type DocumentUpdateDTO = Partial<Pick<DocumentInsertDTO, 'filename' | 'status' | 'failureReason'>>
