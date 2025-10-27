// c3
import type { Failable, Option } from '@c3-oss/functional'

// internal
import type { DocumentDTO, DocumentUpdateDTO } from '~application/dto/index.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Port for document read and update operations.
 */
export interface DocumentRepositoryPort {
  /** Retrieves a document by its external ID. */
  get(idExt: string): Promise<Failable<Option<DocumentDTO>>>
  /** Updates a document with the provided data. */
  update(idExt: string, document: DocumentUpdateDTO): Promise<Failable<Option<DocumentDTO>>>
}
