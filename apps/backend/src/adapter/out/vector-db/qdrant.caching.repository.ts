// c3
import { type Failable, isErr, isSome, ok, val } from '@c3-oss/functional'
import type { Optional } from '@c3-oss/types'

import { BaseAdapter } from '~adapter/shared/base-adapter.js'
// internal
import type {
  IndexedPointDTO,
  PaginatedResultDTO,
  PaginationQueryDTO,
  RepositorySearchResultDTO,
  SearchFilterDTO,
} from '~application/dto/index.js'
import { sha1, stableStringify } from '~out/cache/redis.cache.adapter.js'
import type { CachePort } from '~port/cache.port.js'
import type { VogalRepositoryPort } from '~port/vogal-repository.port.js'
import type { ListDocumentsResultDTO } from '~port/vogal-repository.port.js'

// ---------------------------------------------------------------------------------------------------------------------

const TTL = 21600 // 6h
const ns = (p: string) => `vogal:${process.env.NODE_ENV ?? 'development'}:${p}`

export class CachingQdrantRepository extends BaseAdapter implements VogalRepositoryPort {
  private readonly inner: VogalRepositoryPort
  private readonly cache: CachePort

  public constructor(inner: VogalRepositoryPort, cache: CachePort) {
    super()
    this.invariant({ inner, cache })
    this.inner = inner
    this.cache = cache
  }

  public async initCollection(collectionName: string) {
    return this.inner.initCollection(collectionName)
  }

  public async deleteCollection(collectionName: string) {
    return this.inner.deleteCollection(collectionName)
  }

  public async deleteDocumentVectors(documentId: string, collectionName: string) {
    const result = await this.inner.deleteDocumentVectors(documentId, collectionName)
    if (!isSome(result)) {
      await this.cache.delByPattern(ns('documents:list:*'))
    }
    return result
  }

  public async upsert(points: IndexedPointDTO[], collectionName: string) {
    const result = await this.inner.upsert(points, collectionName)
    if (!isSome(result)) {
      await this.cache.delByPattern(ns('documents:list:*'))
    }
    return result
  }

  public search(
    vector: number[],
    limit: number,
    filter: Optional<SearchFilterDTO>,
    collectionName: string,
  ): Promise<Failable<RepositorySearchResultDTO[]>> {
    return this.inner.search(vector, limit, filter, collectionName)
  }

  public async listDocuments(
    filters: Optional<PaginationQueryDTO>,
    collectionName: string,
  ): Promise<Failable<PaginatedResultDTO<ListDocumentsResultDTO>>> {
    const key = ns(`documents:list:${sha1(stableStringify({ filters, collectionName }))}`)
    const cached = await this.cache.getJSON<PaginatedResultDTO<ListDocumentsResultDTO>>(key)
    if (cached !== null) {
      await this.cache.expire(key, TTL)
      return ok(cached)
    }
    const result = await this.inner.listDocuments(filters, collectionName)
    if (!isErr(result)) {
      await this.cache.setJSON(key, val(result), TTL)
    }
    return result
  }
}
