// 3rd-party
import OpenAI from 'openai'

// c3
import { type Failable, err, ok } from '@c3-oss/functional'

// internal
import { BaseAdapter } from '~adapter/shared/base-adapter.js'
import type { TextNormalizerPort } from '~application/port/index.js'
import { createGenericBreaker } from '~infra/circuit-breaker.js'
import { env } from '~infra/config/env.js'

// ---------------------------------------------------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a text normalizer for PDF documents. Normalize the following page text:

- Remove headers, footers, page numbers, and any repetitive elements.
- Fix formatting issues, ensure consistent structure (e.g., paragraphs, lists).
- Correct accents, spelling, and grammar if needed, but preserve original meaning.
- Output only the clean, normalized main content as plain text.
- Do not add any new information or summaries.

Input text:
`

export class OpenAINormalizer extends BaseAdapter implements TextNormalizerPort {
  private readonly client: OpenAI
  private readonly model: string
  private readonly circuitBreaker

  public constructor() {
    super()
    this.invariant({ apiKey: env.OPENAI_API_KEY, model: env.VOGAL_NORMALIZATION_MODEL })
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY })
    this.model = env.VOGAL_NORMALIZATION_MODEL
    this.circuitBreaker = createGenericBreaker()
  }

  public async normalize(text: string): Promise<Failable<string>> {
    try {
      const response = await this.circuitBreaker.fire(() =>
        this.client.chat.completions.create({
          model: this.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: text },
          ],
        }),
      )

      return ok((response.choices.at(0)?.message?.content ?? '').trim())
    } catch (error) {
      return err(error)
    }
  }
}
