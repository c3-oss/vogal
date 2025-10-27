// c3
import { type Failable, err, isErr, ok } from '@c3-oss/functional'
import type { Logger } from '@c3-oss/logger'

// internal
import type {
  DocumentResultDTO,
  RepositorySearchResultDTO,
  SearchQueryDTO,
  SearchResultDTO,
} from '~application/dto/index.js'

import type { EmbedderPort, VogalRepositoryPort } from '~application/port/index.js'
import { BaseUseCase } from '~application/usecase/base-usecase.js'

// ---------------------------------------------------------------------------------------------------------------------

export interface SearchUseCaseDeps {
  embedder: EmbedderPort
  repository: VogalRepositoryPort
  logger: Logger
}

export class SearchUseCase extends BaseUseCase {
  private readonly embedder: EmbedderPort
  private readonly repository: VogalRepositoryPort
  private readonly log: Logger

  public constructor(deps: SearchUseCaseDeps) {
    super()
    const { embedder, repository, logger } = deps
    this.invariant({ embedder, repository, logger })

    this.embedder = embedder
    this.repository = repository
    this.log = logger.child({ usecase: 'SearchUseCase' })
  }

  private toDocumentResultDto(hit: RepositorySearchResultDTO): DocumentResultDTO {
    return {
      score: hit.score,
      documentId: hit.payload.documentId,
      filename: hit.payload.filename,
      pageNumber: hit.payload.pageNumber,
      chunkIndex: hit.payload.chunkIndex,
      text: hit.payload.text,
      metadata: {
        title: hit.payload.title,
        author: hit.payload.author,
        totalPages: hit.payload.totalPages,
      },
    }
  }

  public async execute(params: SearchQueryDTO): Promise<Failable<SearchResultDTO>> {
    const { query, documentId, workspaceId, limit = 5 } = params
    this.log.debug({ query, documentId, workspaceId, limit }, 'search request received')

    const embeddingsResult = await this.embedder.embedMany([query])
    if (isErr(embeddingsResult)) {
      this.log.warn(
        { query, documentId, workspaceId, error: embeddingsResult.left },
        'failed to generate embedding for query',
      )
      return embeddingsResult
    }

    const vector = embeddingsResult.right.at(0)
    if (!vector) {
      this.log.warn({ query, documentId, workspaceId }, 'embedder returned empty vector for query')
      return err('Could not generate embedding')
    }

    const filter = documentId ? { documentId } : undefined
    const results = await this.repository.search(vector, limit, filter, workspaceId)
    if (isErr(results)) {
      this.log.warn({ query, documentId, workspaceId, error: results.left }, 'vector search failed in repository')
      return results
    }

    const payload = {
      query,
      totalFound: results.right.length,
      results: results.right.map((hit) => this.toDocumentResultDto(hit)),
    }
    this.log.debug({ query, documentId, workspaceId, totalFound: payload.totalFound }, 'search completed')
    return ok(payload)
  }
}
