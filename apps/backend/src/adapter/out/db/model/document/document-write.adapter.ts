// c3
import { type Option, isErr, isSome, none, some } from '@c3-oss/functional'

// internal
import type { DB, DBClient } from '~adapter/out/db/pgconn.js'
import { BaseAdapter } from '~adapter/shared/base-adapter.js'
import type { DocumentMetadataInsertDTO, DocumentPageInsertDTO, DocumentUpdateDTO } from '~application/dto/index.js'
import type {
  DocumentFileReferenceInput,
  DocumentWriteCreateInput,
  DocumentWritePort,
} from '~application/port/document-write.port.js'
import { VErrorProcessingFailed } from '~infra/errors/index.js'
import { DocumentFileRepository } from '../document-file/document-file.repository.js'
import { DocumentMetadataRepository } from '../document-metadata/document-metadata.repository.js'
import { DocumentPageRepository } from '../document-pages/document-page.repository.js'
import { DocumentRepository } from './document.repository.js'

// ---------------------------------------------------------------------------------------------------------------------

export class DocumentWriteAdapter extends BaseAdapter implements DocumentWritePort {
  private readonly db: DBClient
  private readonly documentRepo: DocumentRepository
  private readonly pageRepo: DocumentPageRepository
  private readonly metadataRepo: DocumentMetadataRepository
  private readonly fileRepo: DocumentFileRepository

  public constructor(db: DBClient) {
    super()
    this.invariant(db, { skipKeys: true })
    this.db = db
    this.documentRepo = new DocumentRepository(db)
    this.pageRepo = new DocumentPageRepository(db)
    this.metadataRepo = new DocumentMetadataRepository(db)
    this.fileRepo = new DocumentFileRepository(db)
  }

  public async createDocument(input: DocumentWriteCreateInput) {
    return await this.documentRepo.create(input)
  }

  public async updateDocument(idExt: string, update: DocumentUpdateDTO) {
    return await this.documentRepo.update(idExt, update)
  }

  public async attachFileReference(reference: DocumentFileReferenceInput): Promise<Option<Error>> {
    const result = await this.fileRepo.create({
      documentId: reference.documentId,
      provider: reference.provider,
      bucket: reference.bucket,
      objectKey: reference.objectKey,
      publicUrl: reference.publicUrl ?? null,
    })

    if (isErr(result)) {
      return some(
        new VErrorProcessingFailed({
          message: 'Failed to store document file reference',
          context: {
            documentId: reference.documentId,
            provider: reference.provider,
            error: String(result.left),
          },
        }),
      )
    }

    return none
  }

  public async insertPages(pages: DocumentPageInsertDTO[]): Promise<Option<Error>> {
    try {
      await this.pageRepo.bulkInsert(pages)
      return none
    } catch (e) {
      return some(
        new VErrorProcessingFailed({
          message: 'Failed to insert document pages',
          context: { pagesCount: pages.length, error: String(e) },
        }),
      )
    }
  }

  public async upsertMetadata(metadata: DocumentMetadataInsertDTO[]): Promise<Option<Error>> {
    try {
      await this.metadataRepo.upsertMany(metadata)
      return none
    } catch (e) {
      return some(
        new VErrorProcessingFailed({
          message: 'Failed to upsert document metadata',
          context: { metadataCount: metadata.length, error: String(e) },
        }),
      )
    }
  }

  public async deleteFileReference(documentId: number): Promise<Option<Error>> {
    const result = await this.fileRepo.deleteByDocumentId(documentId)

    if (isSome(result)) {
      return some(
        new VErrorProcessingFailed({
          message: 'Failed to delete document file reference',
          context: { documentId, error: String(result.value) },
        }),
      )
    }

    return none
  }

  public async deletePages(documentId: number): Promise<Option<Error>> {
    const result = await this.pageRepo.deleteByDocumentId(documentId)

    if (isSome(result)) {
      return some(
        new VErrorProcessingFailed({
          message: 'Failed to delete document pages',
          context: { documentId, error: String(result.value) },
        }),
      )
    }

    return none
  }

  public async deleteMetadata(documentId: number): Promise<Option<Error>> {
    const result = await this.metadataRepo.deleteByDocumentId(documentId)

    if (isSome(result)) {
      return some(
        new VErrorProcessingFailed({
          message: 'Failed to delete document metadata',
          context: { documentId, error: String(result.value) },
        }),
      )
    }

    return none
  }

  public async runInTransaction<T>(operation: (unit: DocumentWritePort) => Promise<T>): Promise<T> {
    const rootDb = this.db as DB
    if (typeof rootDb.transaction === 'function') {
      return await rootDb.transaction(async (tx) => {
        const transactionalAdapter = new DocumentWriteAdapter(tx)
        return await operation(transactionalAdapter)
      })
    }

    return await operation(this)
  }
}
