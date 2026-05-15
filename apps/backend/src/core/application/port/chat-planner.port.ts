// c3
import type { Failable } from '@c3-oss/functional'

// ---------------------------------------------------------------------------------------------------------------------

export interface ChatPlannerPort {
  plan(messages: { role: 'system' | 'user' | 'assistant' | 'tool'; content: string }[]): Promise<
    Failable<{
      tool?: { name: 'search_knowledge'; args: { query: string; limit?: number } }
    }>
  >
}
