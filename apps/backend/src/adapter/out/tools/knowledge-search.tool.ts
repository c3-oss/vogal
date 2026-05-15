// c3
import type { Failable } from '@c3-oss/functional'

// internal
import { BaseAdapter } from '~adapter/shared/base-adapter.js'
import type { SearchResultDTO } from '~application/dto/index.js'
import type { ChatToolPort } from '~application/port/index.js'
import type { SearchUseCase } from '~usecase/document/search.js'

// ---------------------------------------------------------------------------------------------------------------------

export class KnowledgeSearchTool extends BaseAdapter implements ChatToolPort {
  public readonly name = 'search_knowledge'
  private readonly search: SearchUseCase

  public constructor(search: SearchUseCase) {
    super()
    this.search = search
  }

  public async execute(params: {
    workspaceIdExt: string
    query: string
    limit?: number
  }): Promise<Failable<{ results: SearchResultDTO }>> {
    const { workspaceIdExt, query, limit = 5 } = params
    const result = await this.search.execute({ query, limit, workspaceId: workspaceIdExt })
    if ('left' in result) return result as unknown as Failable<{ results: SearchResultDTO }>
    return { right: { results: result.right } } as unknown as Failable<{ results: SearchResultDTO }>
  }
}
