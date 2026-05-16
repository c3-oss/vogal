// c3
import type { Failable, Option } from '@c3-oss/functional'

// internal
import type {
  DocumentDTO,
  DocumentListItemDTO,
  DocumentListQueryDTO,
  DocumentUpdateDTO,
  PaginatedResultDTO,
} from '~application/dto/index.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Port for document read and update operations.
 */
export interface DocumentRepositoryPort {
  /** Retrieves a document by its external ID. */
  get(idExt: string): Promise<Failable<Option<DocumentDTO>>>
  /** Updates a document with the provided data. */
  update(idExt: string, document: DocumentUpdateDTO): Promise<Failable<Option<DocumentDTO>>>
  /**
   * Lists documents for the UI, sourced from Postgres so freshly uploaded docs
   * appear before vector indexing finishes. Optional workspace filter; when
   * omitted, returns documents across all (non-deleted) workspaces.
   */
  listForUI(filters: DocumentListQueryDTO): Promise<Failable<PaginatedResultDTO<DocumentListItemDTO>>>
}
