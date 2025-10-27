// internal
import type { tableDocumentMetadata } from '~/adapter/out/db/model/schema.js'

// ---------------------------------------------------------------------------------------------------------------------

/** Complete document metadata from database. */
export type DocumentMetadataDTO = typeof tableDocumentMetadata.$inferSelect
/** Data required to insert document metadata. */
export type DocumentMetadataInsertDTO = typeof tableDocumentMetadata.$inferInsert

/**
 * Basic document information extracted from metadata.
 */
export interface DocumentMetadataBasicInfoDTO {
  /** Document title. */
  title: string
  /** Document author. */
  author: string
}
