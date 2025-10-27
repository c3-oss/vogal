// 3rd-party
import { and, asc, count, desc, eq } from 'drizzle-orm'

// c3
import { type Failable, type Option, err, none, ok, some } from '@c3-oss/functional'
import { errorWrapper } from '@c3-oss/typeguard'

// internal
import { VErrorMultipleResults, VErrorUnknown } from '~/infra/errors/index.js'
import type { DB } from '~adapter/out/db/pgconn.js'
import type { PaginatedResultDTO, PaginationQueryDTO } from '~application/dto/pagination.dto.js'
import type { UserDTO, UserInsertDTO, UserUpdateDTO } from '~application/dto/user.dto.js'
import { BaseRepository } from '../base-repository.js'
import { tableUsers } from './user.schema.js'

// ---------------------------------------------------------------------------------------------------------------------

export class UserRepository extends BaseRepository {
  private readonly db: DB

  public constructor(db: DB) {
    super()

    this.invariant(db, { skipKeys: true })

    this.db = db
  }

  public async create(user: UserInsertDTO): Promise<Failable<string>> {
    try {
      const [createdUser] = await this.db.insert(tableUsers).values(user).returning()
      return !createdUser
        ? err(new VErrorUnknown({ message: 'User creation did not yield a result' }))
        : ok(createdUser.idExt)
    } catch (error) {
      return err(error)
    }
  }

  public async get(idExt: string): Promise<Failable<Option<UserDTO>>> {
    try {
      const users = await this.db
        .select()
        .from(tableUsers)
        .where(and(eq(tableUsers.idExt, idExt), eq(tableUsers.isDeleted, false)))

      if (users.length > 1) {
        return err(new VErrorMultipleResults({ message: `Multiple users found for unique id "${idExt}"` }))
      }

      const user = users.at(0)
      return ok(user ? some(user) : none)
    } catch (error) {
      return err(error)
    }
  }

  public async getByEmail(email: string): Promise<Failable<Option<UserDTO>>> {
    try {
      const users = await this.db
        .select()
        .from(tableUsers)
        .where(and(eq(tableUsers.email, email), eq(tableUsers.isDeleted, false)))

      if (users.length > 1) {
        return err(new VErrorMultipleResults({ message: `Multiple users found for unique email "${email}"` }))
      }

      const user = users.at(0)
      return ok(user ? some(user) : none)
    } catch (error) {
      return err(error)
    }
  }

  public async getAll(filters: PaginationQueryDTO = {}): Promise<Failable<PaginatedResultDTO<UserDTO>>> {
    try {
      const limit = filters.limit ?? 20
      const page = filters.page ?? 1
      const orderField = filters.orderField ?? 'createdAt'
      const orderDirection = filters.orderDirection ?? 'desc'

      const totalResult = await this.db
        .select({ total: count() })
        .from(tableUsers)
        .where(eq(tableUsers.isDeleted, false))

      const totalCount = Number(totalResult.at(0)?.total ?? 0)
      const offset = (page - 1) * limit

      const orderColumn = (() => {
        switch (orderField) {
          case 'name':
            return tableUsers.name
          case 'email':
            return tableUsers.email
          default:
            return tableUsers.createdAt
        }
      })()

      const base = await this.db
        .select()
        .from(tableUsers)
        .where(eq(tableUsers.isDeleted, false))
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

  public async delete(idExt: string): Promise<Option<Error>> {
    try {
      await this.db
        .update(tableUsers)
        .set({ isDeleted: true, deletedAt: new Date() })
        .where(and(eq(tableUsers.idExt, idExt), eq(tableUsers.isDeleted, false)))

      return none
    } catch (error) {
      return some(errorWrapper(error))
    }
  }

  public async update(idExt: string, user: UserUpdateDTO): Promise<Failable<Option<UserDTO>>> {
    try {
      const payload: Partial<UserInsertDTO> = {}

      if (typeof user.name !== 'undefined') {
        payload.name = user.name
      }
      if (typeof user.email !== 'undefined') {
        payload.email = user.email
      }

      if (Object.keys(payload).length === 0) {
        return ok(none)
      }

      payload.updatedAt = new Date()

      const [updatedUser] = await this.db
        .update(tableUsers)
        .set(payload)
        .where(and(eq(tableUsers.idExt, idExt), eq(tableUsers.isDeleted, false)))
        .returning()

      return ok(updatedUser ? some(updatedUser) : none)
    } catch (error) {
      return err(error)
    }
  }
}
