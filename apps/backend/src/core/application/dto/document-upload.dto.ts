// internal
import type { tableDocumentUploads } from '~/adapter/out/db/model/schema.js'

// ---------------------------------------------------------------------------------------------------------------------

/** Complete document upload data from database. */
export type DocumentUploadDTO = typeof tableDocumentUploads.$inferSelect
/** Data required to insert a document upload record. */
export type DocumentUploadInsertDTO = typeof tableDocumentUploads.$inferInsert
