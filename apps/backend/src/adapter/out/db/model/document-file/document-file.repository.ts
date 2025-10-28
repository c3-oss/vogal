// 3rd-party
import { eq } from 'drizzle-orm'

// c3
import { type Failable, type Option, err, none, ok, some } from '@c3-oss/functional'
import { errorWrapper } from '@c3-oss/typeguard'

// internal
import type { DBClient } from '~adapter/out/db/pgconn.js'
import type { DocumentFileDTO, DocumentFileInsertDTO } from '~application/dto/document-file.dto.js'
import { VErrorUnknown } from '~infra/errors/index.js'
import { BaseRepository } from '../base-repository.js'
import { tableDocumentFiles } from '../schema.js'

// ---------------------------------------------------------------------------------------------------------------------

export class DocumentFileRepository extends BaseRepository {
  private readonly db: DBClient

  public constructor(db: DBClient) {
    super()

    this.invariant(db, { skipKeys: true })

    this.db = db
  }

  public async create(row: DocumentFileInsertDTO): Promise<Failable<DocumentFileDTO>> {
    try {
      const [created] = await this.db.insert(tableDocumentFiles).values(row).returning()
      return created
        ? ok(created)
        : err(new VErrorUnknown({ message: 'Document file creation did not yield a result' }))
    } catch (error) {
      return err(error)
    }
  }

  public async deleteByDocumentId(documentId: number): Promise<Option<Error>> {
    try {
      await this.db.delete(tableDocumentFiles).where(eq(tableDocumentFiles.documentId, documentId))
      return none
    } catch (error) {
      return some(errorWrapper(error))
    }
  }
}
