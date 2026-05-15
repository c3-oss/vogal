// c3
import type { Failable } from '@c3-oss/functional'

// internal
import type { SearchResultDTO } from '~application/dto/index.js'

// ---------------------------------------------------------------------------------------------------------------------

export interface ChatToolPort {
  readonly name: string
  execute(params: { workspaceIdExt: string; query: string; limit?: number }): Promise<
    Failable<{ results: SearchResultDTO }>
  >
}
