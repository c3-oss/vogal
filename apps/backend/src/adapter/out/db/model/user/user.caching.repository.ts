// c3
import { type Failable, type Option, isErr, ok, val } from '@c3-oss/functional'

// internal
import type {
  PaginatedResultDTO,
  PaginationQueryDTO,
  UserDTO,
  UserInsertDTO,
  UserUpdateDTO,
} from '~application/dto/index.js'
import { sha1, stableStringify } from '~out/cache/redis.cache.adapter.js'
import type { CachePort } from '~port/cache.port.js'
import type { UserRepositoryPort } from '~port/user-repository.port.js'

// ---------------------------------------------------------------------------------------------------------------------

const TTL = 21600 // 6h
const ns = (p: string) => `rag:${process.env.NODE_ENV ?? 'development'}:${p}`

export class CachingUserRepository implements UserRepositoryPort {
  private readonly inner: UserRepositoryPort
  private readonly cache: CachePort

  public constructor(inner: UserRepositoryPort, cache: CachePort) {
    this.inner = inner
    this.cache = cache
  }

  public async create(user: UserInsertDTO): Promise<Failable<string>> {
    const result = await this.inner.create(user)
    // Invalidate lists
    await this.cache.delByPattern(ns('users:list:*'))
    return result
  }

  public async get(idExt: string): Promise<Failable<Option<UserDTO>>> {
    const key = ns(`users:by-id:${idExt}`)
    const cached = await this.cache.getJSON<Option<UserDTO>>(key)
    if (cached !== null) {
      await this.cache.expire(key, TTL)
      return ok(cached)
    }
    const result = await this.inner.get(idExt)
    if (!isErr(result)) {
      await this.cache.setJSON(key, val(result), TTL)
    }
    return result
  }

  public async getByEmail(email: string): Promise<Failable<Option<UserDTO>>> {
    // bypass cache to reduce key surface; not required by scope
    return this.inner.getByEmail(email)
  }

  public async getAll(filters: PaginationQueryDTO = {}): Promise<Failable<PaginatedResultDTO<UserDTO>>> {
    const key = ns(`users:list:${sha1(stableStringify(filters))}`)
    const cached = await this.cache.getJSON<PaginatedResultDTO<UserDTO>>(key)
    if (cached !== null) {
      await this.cache.expire(key, TTL)
      return ok(cached)
    }
    const result = await this.inner.getAll(filters)
    if (!isErr(result)) {
      await this.cache.setJSON(key, val(result), TTL)
    }
    return result
  }

  public async update(idExt: string, user: UserUpdateDTO): Promise<Failable<Option<UserDTO>>> {
    const result = await this.inner.update(idExt, user)
    await this.cache.del(ns(`users:by-id:${idExt}`))
    await this.cache.delByPattern(ns('users:list:*'))
    return result
  }

  public async delete(idExt: string): Promise<Option<Error>> {
    const result = await this.inner.delete(idExt)
    await this.cache.del(ns(`users:by-id:${idExt}`))
    await this.cache.delByPattern(ns('users:list:*'))
    return result
  }
}
