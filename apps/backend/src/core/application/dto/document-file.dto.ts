// internal
import type { tableDocumentFiles } from '~/adapter/out/db/model/schema.js'

// ---------------------------------------------------------------------------------------------------------------------

/** Complete document file metadata stored in the database. */
export type DocumentFileDTO = typeof tableDocumentFiles.$inferSelect
/** Data required to insert a new document file metadata row. */
export type DocumentFileInsertDTO = typeof tableDocumentFiles.$inferInsert
