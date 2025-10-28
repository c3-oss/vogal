// 3rd-party
import OpenAI from 'openai'

// c3
import { type Failable, err, ok } from '@c3-oss/functional'

// internal
import { BaseAdapter } from '~adapter/shared/base-adapter.js'
import { env } from '~infra/config/env.js'
import type { Matrix } from '~infra/contracts.js'
import { VErrorExternalServiceUnavailable, VErrorRateLimited } from '~infra/errors/index.js'
import type { EmbedderPort } from '~port/index.js'

// ---------------------------------------------------------------------------------------------------------------------

export class OpenAIEmbedder extends BaseAdapter implements EmbedderPort {
  private readonly client: OpenAI
  private readonly model: string

  public constructor() {
    super()
    this.invariant({ apiKey: env.OPENAI_API_KEY, model: env.VOGAL_EMBEDDING_MODEL })
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY })
    this.model = env.VOGAL_EMBEDDING_MODEL
  }

  public async embedMany(texts: string[]): Promise<Failable<Matrix<number>>> {
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: texts,
      })
      return ok(response.data.map((i) => i.embedding))
    } catch (error) {
      // Check if it's a rate limit error
      const errorMsg = error instanceof Error ? error.message : String(error)
      if (errorMsg.includes('rate') || errorMsg.includes('429') || errorMsg.includes('quota')) {
        return err(
          new VErrorRateLimited({
            message: 'OpenAI API rate limit exceeded',
            context: { model: this.model, textsCount: texts.length, error: errorMsg },
          }),
        )
      }

      return err(
        new VErrorExternalServiceUnavailable({
          message: 'OpenAI embeddings API unavailable',
          context: { model: this.model, textsCount: texts.length, error: errorMsg },
        }),
      )
    }
  }
}
