// 3rd-party
import { type Failable, type Option, err, none, ok, some } from '@c3-oss/functional'
import { eq } from 'drizzle-orm'

// c3
import { errorWrapper } from '@c3-oss/typeguard'

// internal
import type { DBClient } from '~adapter/out/db/pgconn.js'
import type { DocumentDTO, DocumentInsertDTO, DocumentUpdateDTO } from '~application/dto/document.dto.js'
import { BaseRepository } from '../base-repository.js'
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
