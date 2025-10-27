// 3rd-party
import { and, asc, count, desc, eq } from 'drizzle-orm'

// c3
import { type Failable, type Option, err, none, ok, some } from '@c3-oss/functional'
import { errorWrapper } from '@c3-oss/typeguard'

// internal
import { VErrorMultipleResults, VErrorUnknown } from '~/infra/errors/index.js'
import type { DB } from '~adapter/out/db/pgconn.js'
import type { PaginatedResultDTO, PaginationQueryDTO } from '~application/dto/pagination.dto.js'
import type { WorkspaceDTO, WorkspaceInsertDTO, WorkspaceUpdateDTO } from '~application/dto/workspace.dto.js'
import { BaseRepository } from '../base-repository.js'
import { tableUsers } from '../user/user.schema.js'
import { tableWorkspaces } from './workspace.schema.js'

// ---------------------------------------------------------------------------------------------------------------------

export class WorkspaceRepository extends BaseRepository {
  private readonly db: DB

  public constructor(db: DB) {
    super()

    this.invariant(db, { skipKeys: true })

    this.db = db
  }

  public async create(workspace: WorkspaceInsertDTO): Promise<Failable<string>> {
    try {
      const [createdWorkspace] = await this.db.insert(tableWorkspaces).values(workspace).returning()
      return !createdWorkspace
        ? err(new VErrorUnknown({ message: 'Workspace creation did not yield a result' }))
        : ok(createdWorkspace.idExt)
    } catch (error) {
      return err(error)
    }
  }

  public async get(idExt: string): Promise<Failable<Option<WorkspaceDTO>>> {
    try {
      const workspaces = await this.db
        .select()
        .from(tableWorkspaces)
        .where(and(eq(tableWorkspaces.idExt, idExt), eq(tableWorkspaces.isDeleted, false)))

      if (workspaces.length > 1) {
        return err(new VErrorMultipleResults({ message: `Multiple workspaces found for unique id "${idExt}"` }))
      }

      const workspace = workspaces.at(0)
      return ok(workspace ? some(workspace) : none)
    } catch (error) {
      return err(error)
    }
  }

  public async getAll(filters: PaginationQueryDTO = {}): Promise<Failable<PaginatedResultDTO<WorkspaceDTO>>> {
    try {
      const limit = filters.limit ?? 20
      const page = filters.page ?? 1
      const orderField = filters.orderField ?? 'createdAt'
      const orderDirection = filters.orderDirection ?? 'desc'

      const totalResult = await this.db
        .select({ total: count() })
        .from(tableWorkspaces)
        .where(eq(tableWorkspaces.isDeleted, false))

      const totalCount = Number(totalResult.at(0)?.total ?? 0)
      const offset = (page - 1) * limit

      const orderColumn = (() => {
        switch (orderField) {
          case 'name':
            return tableWorkspaces.name
          default:
            return tableWorkspaces.createdAt
        }
      })()

      const base = await this.db
        .select()
        .from(tableWorkspaces)
        .where(eq(tableWorkspaces.isDeleted, false))
        .orderBy(orderDirection === 'asc' ? asc(orderColumn) : desc(orderColumn))
        .limit(limit)
        .offset(offset)

      const totalPages = limit > 0 ? Math.ceil(totalCount / limit) : 0
      const meta = {
        totalResults: totalCount,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1 && totalPages > 0,
      }

      return ok({ meta, items: base })
    } catch (error) {
      return err(error)
    }
  }

  public async getByUser(userId: string): Promise<Failable<Option<WorkspaceDTO[]>>> {
    try {
      const result = await this.db
        .select({
          id: tableWorkspaces.id,
          idExt: tableWorkspaces.idExt,
          name: tableWorkspaces.name,
          userId: tableWorkspaces.userId,
          isDeleted: tableWorkspaces.isDeleted,
          deletedAt: tableWorkspaces.deletedAt,
          createdAt: tableWorkspaces.createdAt,
          updatedAt: tableWorkspaces.updatedAt,
        })
        .from(tableWorkspaces)
        .innerJoin(tableUsers, eq(tableWorkspaces.userId, tableUsers.id))
        .where(and(eq(tableUsers.idExt, userId), eq(tableWorkspaces.isDeleted, false)))

      return ok(some(result))
    } catch (error) {
      return err(error)
    }
  }

  public async delete(idExt: string): Promise<Option<Error>> {
    try {
      await this.db
        .update(tableWorkspaces)
        .set({ isDeleted: true, deletedAt: new Date() })
        .where(eq(tableWorkspaces.idExt, idExt))

      return none
    } catch (error) {
      return some(errorWrapper(error))
    }
  }

  public async update(idExt: string, workspace: WorkspaceUpdateDTO): Promise<Failable<Option<WorkspaceDTO>>> {
    try {
      const payload: Partial<WorkspaceInsertDTO> = {}

      if (typeof workspace.name !== 'undefined') {
        payload.name = workspace.name
      }

      if (Object.keys(payload).length === 0) {
        return ok(none)
      }

      payload.updatedAt = new Date()

      const [updatedWorkspace] = await this.db
        .update(tableWorkspaces)
        .set(payload)
        .where(and(eq(tableWorkspaces.idExt, idExt), eq(tableWorkspaces.isDeleted, false)))
        .returning()

      return ok(updatedWorkspace ? some(updatedWorkspace) : none)
    } catch (error) {
      return err(error)
    }
  }
}
