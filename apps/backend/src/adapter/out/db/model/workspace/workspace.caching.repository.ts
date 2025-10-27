// c3
import { type Failable, type Option, isErr, ok, val } from '@c3-oss/functional'

// internal
import type {
  PaginatedResultDTO,
  PaginationQueryDTO,
  WorkspaceDTO,
  WorkspaceInsertDTO,
  WorkspaceUpdateDTO,
} from '~application/dto/index.js'
import { sha1, stableStringify } from '~out/cache/redis.cache.adapter.js'
import type { CachePort } from '~port/cache.port.js'
import type { WorkspaceRepositoryPort } from '~port/workspace-repository.port.js'

// ---------------------------------------------------------------------------------------------------------------------

const TTL = 21600 // 6h
const ns = (p: string) => `rag:${process.env.NODE_ENV ?? 'development'}:${p}`

export class CachingWorkspaceRepository implements WorkspaceRepositoryPort {
  private readonly inner: WorkspaceRepositoryPort
  private readonly cache: CachePort

  public constructor(inner: WorkspaceRepositoryPort, cache: CachePort) {
    this.inner = inner
    this.cache = cache
  }

  public async create(workspace: WorkspaceInsertDTO): Promise<Failable<string>> {
    const result = await this.inner.create(workspace)
    await this.cache.delByPattern(ns('workspaces:list:*'))
    return result
  }

  public async get(idExt: string): Promise<Failable<Option<WorkspaceDTO>>> {
    const key = ns(`workspaces:by-id:${idExt}`)
    const cached = await this.cache.getJSON<Option<WorkspaceDTO>>(key)
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

  public async getAll(filters: PaginationQueryDTO = {}): Promise<Failable<PaginatedResultDTO<WorkspaceDTO>>> {
    const key = ns(`workspaces:list:${sha1(stableStringify(filters))}`)
    const cached = await this.cache.getJSON<PaginatedResultDTO<WorkspaceDTO>>(key)
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

  public async getByUser(userId: string): Promise<Failable<Option<WorkspaceDTO[]>>> {
    const key = ns(`workspaces:by-user:${userId}:${sha1('')}`)
    const cached = await this.cache.getJSON<Option<WorkspaceDTO[]>>(key)
    if (cached !== null) {
      await this.cache.expire(key, TTL)
      return ok(cached)
    }
    const result = await this.inner.getByUser(userId)
    if (!isErr(result)) {
      await this.cache.setJSON(key, val(result), TTL)
    }
    return result
  }

  public async update(idExt: string, workspace: WorkspaceUpdateDTO): Promise<Failable<Option<WorkspaceDTO>>> {
    const result = await this.inner.update(idExt, workspace)
    await this.cache.del(ns(`workspaces:by-id:${idExt}`))
    await this.cache.delByPattern(ns('workspaces:list:*'))
    return result
  }

  public async delete(idExt: string): Promise<Option<Error>> {
    const result = await this.inner.delete(idExt)
    await this.cache.del(ns(`workspaces:by-id:${idExt}`))
    await this.cache.delByPattern(ns('workspaces:list:*'))
    return result
  }
}
