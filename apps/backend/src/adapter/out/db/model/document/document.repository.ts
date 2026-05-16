// 3rd-party
import { type Failable, type Option, err, none, ok, some } from '@c3-oss/functional'
import { type SQL, and, asc, count, desc, eq, inArray } from 'drizzle-orm'

// c3
import { errorWrapper } from '@c3-oss/typeguard'

// internal
import type { DBClient } from '~adapter/out/db/pgconn.js'
import type {
  DocumentDTO,
  DocumentInsertDTO,
  DocumentListItemDTO,
  DocumentListQueryDTO,
  DocumentUpdateDTO,
  PaginatedResultDTO,
} from '~application/dto/index.js'
import { BaseRepository } from '../base-repository.js'
import { tableDocumentUploads } from '../document-uploads/document-upload.schema.js'
import { tableWorkspaces } from '../workspace/workspace.schema.js'
import { tableDocuments } from './document.schema.js'

// ---------------------------------------------------------------------------------------------------------------------

export class DocumentRepository extends BaseRepository {
  private readonly db: DBClient

  public constructor(db: DBClient) {
    super()

    this.invariant(db, { skipKeys: true })

    this.db = db
  }

  public async create(document: DocumentInsertDTO): Promise<Failable<{ id: number; idExt: string }>> {
    const [createdDocument] = await this.db.insert(tableDocuments).values(document).returning()
    if (!createdDocument) {
      return err('Failed to create document')
    }
    const { id, idExt } = createdDocument
    return ok({ id, idExt })
  }

  public async get(idExt: string): Promise<Failable<Option<DocumentDTO>>> {
    try {
      const documents = await this.db.select().from(tableDocuments).where(eq(tableDocuments.idExt, idExt))
      const document = documents.at(0)
      return ok(document ? some(document) : none)
    } catch (error) {
      return err(error)
    }
  }

  public async getAll(): Promise<Failable<DocumentDTO[]>> {
    try {
      const documents = await this.db.select().from(tableDocuments)
      return ok(documents)
    } catch (error) {
      return err(error)
    }
  }

  public async getByWorkspace(workspaceId: string): Promise<Failable<DocumentDTO[]>> {
    try {
      const result = await this.db
        .select({
          id: tableDocuments.id,
          idExt: tableDocuments.idExt,
          workspaceId: tableDocuments.workspaceId,
          filename: tableDocuments.filename,
          contentType: tableDocuments.contentType,
          status: tableDocuments.status,
          failureReason: tableDocuments.failureReason,
          createdAt: tableDocuments.createdAt,
          updatedAt: tableDocuments.updatedAt,
        })
        .from(tableDocuments)
        .innerJoin(tableWorkspaces, eq(tableDocuments.workspaceId, tableWorkspaces.id))
        .where(eq(tableWorkspaces.idExt, workspaceId))

      return ok(result)
    } catch (error) {
      return err(error)
    }
  }

  public async delete(idExt: string): Promise<Option<Error>> {
    try {
      await this.db.delete(tableDocuments).where(eq(tableDocuments.idExt, idExt))
      return none
    } catch (error) {
      return some(errorWrapper(error))
    }
  }

  public async listForUI(filters: DocumentListQueryDTO): Promise<Failable<PaginatedResultDTO<DocumentListItemDTO>>> {
    try {
      const { workspaceIdExt, limit, page, orderField, orderDirection } = filters
      const offset = Math.max(0, (page - 1) * limit)

      const orderColumn =
        orderField === 'createdAt'
          ? tableDocuments.createdAt
          : orderField === 'status'
            ? tableDocuments.status
            : tableDocuments.filename
      const orderExpr: SQL = orderDirection === 'desc' ? desc(orderColumn) : asc(orderColumn)

      const whereClause = workspaceIdExt
        ? and(eq(tableWorkspaces.isDeleted, false), eq(tableWorkspaces.idExt, workspaceIdExt))
        : eq(tableWorkspaces.isDeleted, false)

      const rowsPromise = this.db
        .select({
          id: tableDocuments.id,
          idExt: tableDocuments.idExt,
          filename: tableDocuments.filename,
          status: tableDocuments.status,
          failureReason: tableDocuments.failureReason,
          createdAt: tableDocuments.createdAt,
          updatedAt: tableDocuments.updatedAt,
          workspaceIdExt: tableWorkspaces.idExt,
          workspaceName: tableWorkspaces.name,
        })
        .from(tableDocuments)
        .innerJoin(tableWorkspaces, eq(tableDocuments.workspaceId, tableWorkspaces.id))
        .where(whereClause)
        .orderBy(orderExpr, desc(tableDocuments.id))
        .limit(limit)
        .offset(offset)

      const totalPromise = this.db
        .select({ value: count() })
        .from(tableDocuments)
        .innerJoin(tableWorkspaces, eq(tableDocuments.workspaceId, tableWorkspaces.id))
        .where(whereClause)

      const [rows, totalRows] = await Promise.all([rowsPromise, totalPromise])
      const totalResults = totalRows[0]?.value ?? 0

      const uploads = rows.length
        ? await this.db
            .select({
              documentId: tableDocumentUploads.documentId,
              currentStep: tableDocumentUploads.currentStep,
              lastCompletedStep: tableDocumentUploads.lastCompletedStep,
              errorMessage: tableDocumentUploads.errorMessage,
              createdAt: tableDocumentUploads.createdAt,
            })
            .from(tableDocumentUploads)
            .where(
              inArray(
                tableDocumentUploads.documentId,
                rows.map((row) => row.id),
              ),
            )
            .orderBy(desc(tableDocumentUploads.createdAt), desc(tableDocumentUploads.id))
        : []

      const latestUploadByDocId = new Map<number, (typeof uploads)[number]>()
      for (const upload of uploads) {
        if (!latestUploadByDocId.has(upload.documentId)) {
          latestUploadByDocId.set(upload.documentId, upload)
        }
      }

      const items: DocumentListItemDTO[] = rows.map((row) => {
        const upload = latestUploadByDocId.get(row.id)
        return {
          documentId: row.idExt,
          filename: row.filename,
          status: row.status,
          failureReason: row.failureReason,
          currentStep: upload?.currentStep ?? null,
          lastCompletedStep: upload?.lastCompletedStep ?? null,
          errorMessage: upload?.errorMessage ?? null,
          workspaceId: row.workspaceIdExt,
          workspaceName: row.workspaceName,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        }
      })

      const totalPages = limit > 0 ? Math.ceil(totalResults / limit) : 0
      const currentPage = page

      return ok({
        meta: {
          totalResults,
          totalPages,
          currentPage,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1,
        },
        items,
      })
    } catch (error) {
      return err(error)
    }
  }

  public async update(idExt: string, document: DocumentUpdateDTO): Promise<Failable<Option<DocumentDTO>>> {
    try {
      const payload: Partial<DocumentInsertDTO> = {}

      if (typeof document.filename !== 'undefined') {
        payload.filename = document.filename
      }

      if (typeof document.status !== 'undefined') {
        payload.status = document.status
      }

      if ('failureReason' in document) {
        payload.failureReason = document.failureReason ?? null
      }

      if (Object.keys(payload).length === 0) {
        return ok(none)
      }

      payload.updatedAt = new Date()

      const [updatedDocument] = await this.db
        .update(tableDocuments)
        .set(payload)
        .where(eq(tableDocuments.idExt, idExt))
        .returning()

      return ok(updatedDocument ? some(updatedDocument) : none)
    } catch (error) {
      return err(error)
    }
  }
}
