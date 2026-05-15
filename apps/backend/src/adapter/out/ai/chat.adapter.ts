// 3rd-party
import OpenAI from 'openai'

// c3
import { type Failable, err, ok } from '@c3-oss/functional'

// internal
import { BaseAdapter } from '~adapter/shared/base-adapter.js'
import type { ChatLLMPort } from '~application/port/index.js'
import { createGenericBreaker } from '~infra/circuit-breaker.js'
import { env } from '~infra/config/env.js'

// ---------------------------------------------------------------------------------------------------------------------

export class OpenAIChatAdapter extends BaseAdapter implements ChatLLMPort {
  private readonly client: OpenAI
  private readonly model: string
  private readonly circuitBreaker

  public constructor() {
    super()
    this.invariant({ apiKey: env.OPENAI_API_KEY })
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY })
    this.model = env.VOGAL_CHAT_MODEL ?? 'gpt-4o-mini'
    this.circuitBreaker = createGenericBreaker()
  }

  public async complete(params: {
    workspaceIdExt: string
    messages: { role: 'system' | 'user' | 'assistant' | 'tool'; content: string }[]
    contextChunks?: string[]
  }): Promise<Failable<{ content: string }>> {
    const { messages, contextChunks = [] } = params

    const systemPreamble =
      'You are Vogal, an assistant that answers strictly based on provided context. If the context is insufficient, reply that you do not know.'
    const contextBlock = contextChunks.length
      ? `\n\nContext:\n${contextChunks.map((c, i) => `(${i + 1}) ${c}`).join('\n\n')}`
      : ''

    try {
      const nonToolMessages = messages.filter((m) => m.role !== 'tool') as Array<{
        role: 'system' | 'user' | 'assistant'
        content: string
      }>

      const response = await this.circuitBreaker.fire(() =>
        this.client.chat.completions.create({
          model: this.model,
          stream: false,
          messages: [{ role: 'system', content: `${systemPreamble}${contextBlock}` }, ...nonToolMessages],
        }),
      )

      return ok({
        content: ((response as OpenAI.Chat.Completions.ChatCompletion).choices.at(0)?.message?.content ?? '').trim(),
      })
    } catch (error) {
      return err(error)
    }
  }
}
