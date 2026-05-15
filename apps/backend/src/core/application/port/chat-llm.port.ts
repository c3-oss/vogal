// c3
import type { Failable } from '@c3-oss/functional'

// ---------------------------------------------------------------------------------------------------------------------

export interface ChatLLMPort {
  complete(params: {
    workspaceIdExt: string
    messages: { role: 'system' | 'user' | 'assistant' | 'tool'; content: string }[]
    contextChunks?: string[]
  }): Promise<Failable<{ content: string }>>
}
