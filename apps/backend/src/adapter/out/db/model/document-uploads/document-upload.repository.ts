// 3rd-party
import { eq } from 'drizzle-orm'

// c3
import { type Failable, type Option, err, none, ok, some } from '@c3-oss/functional'

// internal
import { VErrorMultipleResults, VErrorUnknown } from '~/infra/errors/index.js'
import type { DB } from '~adapter/out/db/pgconn.js'
import type { DocumentDTO, DocumentUploadDTO, DocumentUploadInsertDTO } from '~application/dto/index.js'
import { BaseRepository } from '../base-repository.js'
import { tableDocumentUploads, tableDocuments } from '../schema.js'

// ---------------------------------------------------------------------------------------------------------------------

type DocumentUploadStatusRow = DocumentUploadDTO & {
  documentStatus: DocumentDTO['status']
  documentFailureReason: DocumentDTO['failureReason']
}

export class DocumentUploadRepository extends BaseRepository {
  private readonly db: DB

  public constructor(db: DB) {
    super()

    this.invariant(db, { skipKeys: true })

    this.db = db
  }

  public async create(row: DocumentUploadInsertDTO): Promise<Failable<DocumentUploadDTO>> {
    try {
      const [created] = await this.db.insert(tableDocumentUploads).values(row).returning()
      return created
        ? ok(created)
        : err(new VErrorUnknown({ message: 'Document upload creation did not yield a result' }))
    } catch (error) {
      return err(error)
    }
  }

  public async updateById(id: number, changes: Partial<DocumentUploadInsertDTO>): Promise<Option<Error>> {
    try {
      const payload: Partial<DocumentUploadInsertDTO> & { updatedAt: Date } = {
        updatedAt: new Date(),
      }

      for (const [key, value] of Object.entries(changes)) {
        if (typeof value !== 'undefined') {
          // @ts-expect-error dynamic assignment for partial update
          payload[key as keyof DocumentUploadInsertDTO] = value
        }
      }

      await this.db.update(tableDocumentUploads).set(payload).where(eq(tableDocumentUploads.id, id))

      return none
    } catch (error) {
      return some(error instanceof Error ? error : new Error(String(error)))
    }
  }

  public async getById(id: number): Promise<Failable<Option<DocumentUploadDTO>>> {
    try {
      const [row] = await this.db.select().from(tableDocumentUploads).where(eq(tableDocumentUploads.id, id))
      return ok(row ? some(row) : none)
    } catch (error) {
      return err(error)
    }
  }

  public async getByDocumentIdExt(idExt: string): Promise<Failable<Option<DocumentUploadStatusRow>>> {
    try {
      const rows = await this.db
        .select({
          id: tableDocumentUploads.id,
          documentId: tableDocumentUploads.documentId,
          documentIdExt: tableDocumentUploads.documentIdExt,
          workspaceId: tableDocumentUploads.workspaceId,
          workspaceIdExt: tableDocumentUploads.workspaceIdExt,
          jobIdExt: tableDocumentUploads.jobIdExt,
          filename: tableDocumentUploads.filename,
          contentType: tableDocumentUploads.contentType,
          status: tableDocumentUploads.status,
          currentStep: tableDocumentUploads.currentStep,
          lastCompletedStep: tableDocumentUploads.lastCompletedStep,
          retryCount: tableDocumentUploads.retryCount,
          errorMessage: tableDocumentUploads.errorMessage,
          storageProvider: tableDocumentUploads.storageProvider,
          storageBucket: tableDocumentUploads.storageBucket,
          storageObjectKey: tableDocumentUploads.storageObjectKey,
          tempFilePath: tableDocumentUploads.tempFilePath,
          startedAt: tableDocumentUploads.startedAt,
          finishedAt: tableDocumentUploads.finishedAt,
          heartbeatAt: tableDocumentUploads.heartbeatAt,
          createdAt: tableDocumentUploads.createdAt,
          updatedAt: tableDocumentUploads.updatedAt,
          documentStatus: tableDocuments.status,
          documentFailureReason: tableDocuments.failureReason,
        })
        .from(tableDocumentUploads)
        .innerJoin(tableDocuments, eq(tableDocumentUploads.documentId, tableDocuments.id))
        .where(eq(tableDocuments.idExt, idExt))

      if (rows.length > 1) {
        return err(new VErrorMultipleResults({ message: `Multiple uploads found for document id "${idExt}"` }))
      }

      const upload = rows.at(0)
      return ok(upload ? some(upload as DocumentUploadStatusRow) : none)
    } catch (error) {
      return err(error)
    }
  }
}
