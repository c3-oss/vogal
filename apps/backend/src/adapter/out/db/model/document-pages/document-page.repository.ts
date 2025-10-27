// c3
import { eq } from 'drizzle-orm'

// c3
import { type Option, none, some } from '@c3-oss/functional'
import { errorWrapper } from '@c3-oss/typeguard'

// internal
import type { DB } from '~adapter/out/db/pgconn.js'
import type { DocumentPageInsertDTO } from '~application/dto/document-page.dto.js'
import { BaseRepository } from '../base-repository.js'
import { tableDocumentPages } from './document-page.schema.js'

// ---------------------------------------------------------------------------------------------------------------------

export class DocumentPageRepository extends BaseRepository {
  private readonly db: DB

  public constructor(db: DB) {
    super()

    this.invariant(db, { skipKeys: true })

    this.db = db
  }

  public async bulkInsert(pages: DocumentPageInsertDTO[]): Promise<Option<Error>> {
    if (pages.length === 0) {
      return none
    }
    try {
      await this.db.insert(tableDocumentPages).values(pages)
      return none
    } catch (error) {
      return some(errorWrapper(error))
    }
  }

  public async deleteByDocumentId(documentId: number): Promise<Option<Error>> {
    try {
      await this.db.delete(tableDocumentPages).where(eq(tableDocumentPages.documentId, documentId))
      return none
    } catch (error) {
      return some(errorWrapper(error))
    }
  }
}
