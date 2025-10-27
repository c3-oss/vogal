// c3
import type { Failable, Option } from '@c3-oss/functional'
import type { Optional } from '@c3-oss/types'

// internal
import type {
  IndexedPointDTO,
  PaginatedResultDTO,
  PaginationQueryDTO,
  RepositorySearchResultDTO,
  SearchFilterDTO,
} from '~application/dto/index.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Result data for document listing operations.
 */
export interface ListDocumentsResultDTO {
  /** Unique identifier of the document. */
  documentId: string
  /** Optional filename of the document. */
  filename?: string
  /** Optional title extracted from the document. */
  title?: string
  /** Optional author information. */
  author?: string
  /** Optional total number of pages in the document. */
  totalPages?: number
  /** Number of text chunks indexed for this document. */
  chunksCount: number
}

/**
 * Port for Vogal vector database operations.
 */
export interface VogalRepositoryPort {
  /** Initializes a new vector collection. */
  initCollection(collectionName: string): Promise<Option<Error>>
  /** Deletes an existing vector collection. */
  deleteCollection(collectionName: string): Promise<Option<Error>>
  /** Inserts or updates vector points in the collection. */
  upsert(points: IndexedPointDTO[], collectionName: string): Promise<Option<Error>>
  /** Removes all vector points associated with a specific document. */
  deleteDocumentVectors(documentId: string, collectionName: string): Promise<Option<Error>>
  /** Performs semantic search using vector similarity. */
  search(
    vector: number[],
    limit: number,
    filter: Optional<SearchFilterDTO>,
    collectionName: string,
  ): Promise<Failable<RepositorySearchResultDTO[]>>
  /** Lists documents with pagination and filtering. */
  listDocuments(
    filters: Optional<PaginationQueryDTO>,
    collectionName: string,
  ): Promise<Failable<PaginatedResultDTO<ListDocumentsResultDTO>>>
}
