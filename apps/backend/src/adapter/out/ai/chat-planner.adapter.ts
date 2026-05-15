// 3rd-party
import OpenAI from 'openai'

// c3
import { type Failable, err, ok } from '@c3-oss/functional'

// internal
import { BaseAdapter } from '~adapter/shared/base-adapter.js'
import type { ChatPlannerPort } from '~application/port/index.js'
import { createGenericBreaker } from '~infra/circuit-breaker.js'
import { env } from '~infra/config/env.js'

// ---------------------------------------------------------------------------------------------------------------------

export class OpenAIChatPlanner extends BaseAdapter implements ChatPlannerPort {
  private readonly client: OpenAI
  private readonly model: string
  private readonly circuitBreaker

  public constructor() {
    super()
    this.invariant({ apiKey: env.OPENAI_API_KEY })
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY })
    this.model = env.VOGAL_CHAT_PLANNER_MODEL ?? env.VOGAL_CHAT_MODEL ?? 'gpt-4o-mini'
    this.circuitBreaker = createGenericBreaker()
  }

  public async plan(
    messages: { role: 'system' | 'user' | 'assistant' | 'tool'; content: string }[],
  ): Promise<Failable<{ tool?: { name: 'search_knowledge'; args: { query: string; limit?: number } } }>> {
    const system =
      'You are a planner that decides whether to call the tool "search_knowledge". Output ONLY valid JSON with optional tool and args.'
    const outputJSONSchema = {
      type: 'object',
      properties: {
        tool: {
          type: 'object',
          properties: {
            name: { type: 'string', enum: ['search_knowledge'] },
            args: {
              type: 'object',
              properties: {
                query: { type: 'string' },
                limit: { type: 'number' },
              },
              required: ['query'],
              additionalProperties: false,
            },
          },
          required: ['name', 'args'],
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    }

    try {
      const response = await this.circuitBreaker.fire(() =>
        this.client.chat.completions.create({
          model: this.model,
          stream: false,
          messages: [
            { role: 'system', content: system },
            ...(messages.filter((m) => m.role !== 'tool') as Array<{
              role: 'system' | 'user' | 'assistant'
              content: string
            }>),
            { role: 'system', content: `JSON_SCHEMA:\n${JSON.stringify(outputJSONSchema)}` },
            { role: 'system', content: 'Respond with JSON only.' },
          ],
          response_format: { type: 'json_object' },
        }),
      )
      const content = (response as OpenAI.Chat.Completions.ChatCompletion).choices.at(0)?.message?.content ?? '{}'
      const parsed = JSON.parse(content)
      return ok(parsed)
    } catch (error) {
      return err(error)
    }
  }
}
