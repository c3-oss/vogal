/**
 * Individual search result from a document chunk.
 */
export interface DocumentResultDTO {
  /** Similarity score of the result. */
  score: number
  /** External document identifier. */
  documentId?: string
  /** Document filename. */
  filename?: string
  /** Page number where the chunk was found. */
  pageNumber?: number
  /** Index of the text chunk within the document. */
  chunkIndex?: number
  /** Text content of the matching chunk. */
  text?: string
  /** Additional document metadata. */
  metadata?: {
    title?: string
    author?: string
    totalPages?: number
  }
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
