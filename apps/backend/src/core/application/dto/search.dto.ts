import type { DocumentMetadataBasicInfoDTO } from '~application/dto/document-metadata.dto.js'
import type { DocumentPageBasicInfoDTO } from '~application/dto/document-page.dto.js'

/**
 * Individual search result from a document chunk.
 */
export interface DocumentResultDTO extends Partial<DocumentPageBasicInfoDTO> {
  /** Similarity score of the result. */
  score: number
  /** External document identifier. */
  documentId?: string
  /** Document filename. */
  filename?: string
  /** Index of the text chunk within the document. */
  chunkIndex?: number
  /** Additional document metadata. */
  metadata?: Partial<DocumentMetadataBasicInfoDTO & { totalPages: number }>
}

/**
 * Input parameters for a search query.
 */
export interface SearchQueryDTO {
  /** Search query text. */
  query: string
  /** Maximum number of results to return. */
  limit?: number
  /** Filter by specific document ID. */
  documentId?: string
  /** Workspace identifier for the search scope. */
  workspaceId: string
}

/**
 * Complete search response data.
 */
export interface SearchResultDTO {
  /** Original search query. */
  query: string
  /** Total number of matching results found. */
  totalFound: number
  /** Array of document result matches. */
  results: DocumentResultDTO[]
}
