import type { DocumentMetadataBasicInfoDTO } from '~application/dto/document-metadata.dto.js'

/**
 * Payload data associated with an indexed vector point.
 */
export interface IndexedPointPayloadDTO extends Partial<DocumentMetadataBasicInfoDTO> {
  /** External document identifier. */
  documentId: string
  /** Document filename. */
  filename: string
  /** Page number where this chunk originates. */
  pageNumber: number
  /** Index of this chunk within the document. */
  chunkIndex: number
  /** Global index across all documents. */
  chunkGlobalIndex: number
  /** Text content of the chunk. */
  text: string
  /** Total number of pages in the document. */
  totalPages: number
}

/**
 * Complete indexed point for vector search.
 */
export interface IndexedPointDTO {
  /** Unique identifier for the point. */
  id: string
  /** Vector embedding for similarity search. */
  vector: number[]
  /** Associated metadata payload. */
  payload: IndexedPointPayloadDTO
}

/**
 * Individual result from vector search operations.
 */
export interface RepositorySearchResultDTO {
  /** Similarity score of the result. */
  score: number
  /** Payload data of the matching point. */
  payload: IndexedPointPayloadDTO
}

/**
 * Filters to apply during vector search.
 */
export interface SearchFilterDTO {
  /** Filter results to specific document ID. */
  documentId?: string
}
