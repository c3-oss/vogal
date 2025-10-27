// c3
import type { Failable, Option } from '@c3-oss/functional'

// internal
import type { DocumentMetadataInsertDTO, DocumentPageInsertDTO, RecordIdDTO } from '~application/dto/index.js'
import type { StorageProvider } from './storage-provider.port.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Input data for creating a new document.
 */
export interface DocumentWriteCreateInput {
  /** ID of the workspace where the document will be created. */
  workspaceId: number
  /** Name of the file being uploaded. */
  filename: string
  /** MIME type of the document content. */
  contentType: string
}

/**
 * Input data for associating a stored file with a document.
 */
export interface DocumentFileReferenceInput {
  /** Internal document identifier. */
  documentId: number
  /** External storage provider handling the file. */
  provider: StorageProvider
  /** Bucket or container where the file is stored. */
  bucket: string
  /** Object key or path identifying the file within the bucket. */
  objectKey: string
  /** Public or retrievable URL for the stored file, if available. */
  publicUrl?: string | null
}

/**
 * Port for document write operations.
 */
export interface DocumentWritePort {
  /** Creates a new document record in the database. */
  createDocument(input: DocumentWriteCreateInput): Promise<Failable<RecordIdDTO>>
  /** Associates the persistent storage reference for the document source file. */
  attachFileReference(reference: DocumentFileReferenceInput): Promise<Option<Error>>
  /** Inserts multiple document pages into the database. */
  insertPages(pages: DocumentPageInsertDTO[]): Promise<Option<Error>>
  /** Updates or inserts document metadata records. */
  upsertMetadata(metadata: DocumentMetadataInsertDTO[]): Promise<Option<Error>>
}
