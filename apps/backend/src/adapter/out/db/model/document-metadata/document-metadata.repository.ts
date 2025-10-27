// 3rd-party
import { eq, sql } from 'drizzle-orm'

// c3
import { type Option, none, some } from '@c3-oss/functional'
import { errorWrapper } from '@c3-oss/typeguard'

// internal
import type { DB } from '~adapter/out/db/pgconn.js'
import type { DocumentMetadataInsertDTO } from '~application/dto/document-metadata.dto.js'
import { BaseRepository } from '../base-repository.js'
import { tableDocumentMetadata } from './document-metadata.schema.js'

// ---------------------------------------------------------------------------------------------------------------------

export class DocumentMetadataRepository extends BaseRepository {
  private readonly db: DB

  public constructor(db: DB) {
    super()

    this.invariant(db, { skipKeys: true })

    this.db = db
  }

  public async upsertMany(metadata: DocumentMetadataInsertDTO[]): Promise<Option<Error>> {
    try {
      await this.db
        .insert(tableDocumentMetadata)
        .values(metadata)
        .onConflictDoUpdate({
          target: [tableDocumentMetadata.documentId, tableDocumentMetadata.key],
          set: { value: sql.raw('excluded.value') },
        })
      return none
    } catch (error) {
      return some(errorWrapper(error))
    }
  }

  public async deleteByDocumentId(documentId: number): Promise<Option<Error>> {
    try {
      await this.db.delete(tableDocumentMetadata).where(eq(tableDocumentMetadata.documentId, documentId))
      return none
    } catch (error) {
      return some(errorWrapper(error))
    }
  }
}
