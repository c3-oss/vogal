// 3rd-party
import { QdrantClient } from '@qdrant/js-client-rest'

// c3
import { type Failable, type Option, err, none, ok, some } from '@c3-oss/functional'
import type { Optional } from '@c3-oss/types'

// internal
import { BaseAdapter } from '~adapter/shared/base-adapter.js'
import type {
  IndexedPointDTO,
  IndexedPointPayloadDTO,
  PaginatedResultDTO,
  PaginationQueryDTO,
  SearchFilterDTO,
} from '~application/dto/index.js'
import { createGenericBreaker } from '~infra/circuit-breaker.js'
import { env } from '~infra/config/env.js'
import { VErrorExternalServiceUnavailable } from '~infra/errors/index.js'
import type { ListDocumentsResultDTO, VogalRepositoryPort } from '~port/index.js'

// ---------------------------------------------------------------------------------------------------------------------

export interface QdrantSearchResult {
  score: number
  payload: IndexedPointPayloadDTO
}

export class QdrantRepository extends BaseAdapter implements VogalRepositoryPort {
  private readonly client: QdrantClient
  private readonly circuitBreaker

  public constructor() {
    super()
    this.invariant({ url: env.QDRANT_URL })
    this.client = new QdrantClient({ url: env.QDRANT_URL, apiKey: env.QDRANT_API_KEY })
    this.circuitBreaker = createGenericBreaker()
  }

  public async initCollection(collectionName: string): Promise<Option<Error>> {
    try {
      await this.circuitBreaker.fire(() => this.client.getCollection(collectionName))
      return none
    } catch {
      try {
        const vectors = { size: 1536, distance: 'Cosine' as const }
        await this.circuitBreaker.fire(() => this.client.createCollection(collectionName, { vectors }))
        return none
      } catch (error) {
        return some(
          new VErrorExternalServiceUnavailable({
            message: 'Failed to initialize Qdrant collection',
            context: { collectionName, error: String(error) },
          }),
        )
      }
    }
  }

  public async deleteCollection(collectionName: string): Promise<Option<Error>> {
    try {
      await this.circuitBreaker.fire(() => this.client.deleteCollection(collectionName))
      return none
    } catch (error) {
      return some(
        new VErrorExternalServiceUnavailable({
          message: 'Failed to delete Qdrant collection',
          context: { collectionName, error: String(error) },
        }),
      )
    }
  }

  public async deleteDocumentVectors(documentId: string, collectionName: string): Promise<Option<Error>> {
    try {
      await this.circuitBreaker.fire(() =>
        this.client.delete(collectionName, {
          filter: {
            must: [
              {
                key: 'documentId',
                match: { value: documentId },
              },
            ],
          },
        }),
      )
      return none
    } catch (error) {
      return some(
        new VErrorExternalServiceUnavailable({
          message: 'Failed to delete vector points for document',
          context: { collectionName, documentId, error: String(error) },
        }),
      )
    }
  }

  public async upsert(points: IndexedPointDTO[], collectionName: string): Promise<Option<Error>> {
    try {
      // @ts-expect-error qdrant types are permissive enough to allow this
      await this.circuitBreaker.fire(() => this.client.upsert(collectionName, { wait: true, points }))
      return none
    } catch (error) {
      return some(
        new VErrorExternalServiceUnavailable({
          message: 'Failed to upsert points to Qdrant',
          context: { collectionName, pointsCount: points.length, error: String(error) },
        }),
      )
    }
  }

  public async search(
    vector: number[],
    limit: number,
    filterParams: Optional<SearchFilterDTO>,
    collectionName: string,
  ): Promise<Failable<QdrantSearchResult[]>> {
    try {
      const result = await this.circuitBreaker.fire(() =>
        this.client.search(collectionName, {
          vector,
          limit,
          with_payload: true,
          filter: filterParams?.documentId
            ? {
                must: [
                  {
                    key: 'documentId',
                    match: { value: filterParams.documentId },
                  },
                ],
              }
            : undefined,
        }),
      )

      return ok(
        result.map((hit) => ({
          score: hit.score,
          payload: (hit.payload ?? {}) as unknown as IndexedPointPayloadDTO,
        })),
      )
    } catch (error) {
      return err(error)
    }
  }

  public async listDocuments(
    filters: Optional<PaginationQueryDTO>,
    collectionName: string,
  ): Promise<Failable<PaginatedResultDTO<ListDocumentsResultDTO>>> {
    try {
      const scroll = await this.circuitBreaker.fire(() =>
        this.client.scroll(collectionName, { limit: 1000, with_payload: true }),
      )
      const documents = new Map<string, ListDocumentsResultDTO>()

      for (const pt of scroll.points) {
        const p = pt.payload as Optional<IndexedPointPayloadDTO>
        if (!p) {
          continue
        }
        const key = p.documentId

        if (!documents.has(key)) {
          documents.set(key, {
            documentId: key,
            filename: p.filename,
            totalPages: p.totalPages,
            title: p.title,
            author: p.author,
            chunksCount: 0,
          })
        }
        const current = documents.get(key)
        if (current !== undefined) {
          current.chunksCount++
        }
      }
      let items = Array.from(documents.values())
      const { orderField = 'filename', orderDirection = 'asc', limit = 20, page = 1 } = filters ?? {}

      // sort
      const getField = (d: ListDocumentsResultDTO): Optional<string | number> => {
        switch (orderField) {
          case 'title':
            return d.title
          case 'author':
            return d.author
          case 'chunksCount':
            return d.chunksCount
          default:
            return d.filename
        }
      }

      items.sort((a, b) => {
        const dir = orderDirection === 'asc' ? 1 : -1
        const av = getField(a)
        const bv = getField(b)
        if (av == null && bv == null) return 0
        if (av == null) return -1 * dir
        if (bv == null) return 1 * dir
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
        return String(av).localeCompare(String(bv)) * dir
      })

      // paginate
      const totalResults = items.length
      const totalPages = limit > 0 ? Math.ceil(totalResults / limit) : 0
      const currentPage = page
      const hasNextPage = currentPage < totalPages
      const hasPreviousPage = currentPage > 1 && totalPages > 0
      const offset = (page - 1) * limit
      items = limit > 0 ? items.slice(offset, offset + limit) : items

      return ok({
        meta: { totalResults, totalPages, currentPage, hasNextPage, hasPreviousPage },
        items,
      })
    } catch (error) {
      return err(error)
    }
  }
}
