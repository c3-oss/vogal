import { isErr, val } from '@c3-oss/functional'
import { describe, expect, it, vi } from 'vitest'

let mockCreate: any

vi.mock('openai', () => {
  class EmbeddingsApi {
    async create(_: any) {
      return mockCreate
        ? mockCreate()
        : {
            data: [{ embedding: [0.1, 0.2] }, { embedding: [0.3, 0.4] }],
          }
    }
  }

  class OpenAI {
    embeddings = new EmbeddingsApi()
  }

  return { default: OpenAI }
})

import { VErrorExternalServiceUnavailable, VErrorRateLimited } from '~infra/errors/index.js'
import { OpenAIEmbedder } from '../embeddings.adapter.js'

describe('OpenAIEmbedder', () => {
  it('embedMany returns embeddings from OpenAI response', async () => {
    mockCreate = null
    const embedder = new OpenAIEmbedder()
    const result = await embedder.embedMany(['a', 'b'])

    if (isErr(result)) {
      throw result.left
    }

    expect(val(result)).toEqual([
      [0.1, 0.2],
      [0.3, 0.4],
    ])
  })

  it('embedMany returns rate limit error when API responds with 429', async () => {
    mockCreate = () => {
      throw new Error('Rate limit exceeded: 429 status code')
    }

    const embedder = new OpenAIEmbedder()
    const result = await embedder.embedMany(['test'])

    expect(isErr(result)).toBe(true)
    if (isErr(result)) {
      expect(result.left).toBeInstanceOf(VErrorRateLimited)
      expect(result.left.message).toContain('OpenAI API rate limit exceeded')
    }
  })

  it('embedMany returns rate limit error when error message contains "rate"', async () => {
    mockCreate = () => {
      const error = new Error('OpenAI rate limit exceeded')
      throw error
    }

    const embedder = new OpenAIEmbedder()
    const result = await embedder.embedMany(['test'])

    expect(isErr(result)).toBe(true)
    if (isErr(result)) {
      expect(result.left).toBeInstanceOf(VErrorRateLimited)
      expect(result.left.message).toContain('OpenAI API rate limit exceeded')
    }
  })

  it('embedMany returns rate limit error when error message contains "quota"', async () => {
    mockCreate = () => {
      const error = new Error('API quota exceeded for this model')
      throw error
    }

    const embedder = new OpenAIEmbedder()
    const result = await embedder.embedMany(['test'])

    expect(isErr(result)).toBe(true)
    if (isErr(result)) {
      expect(result.left).toBeInstanceOf(VErrorRateLimited)
      expect(result.left.message).toContain('OpenAI API rate limit exceeded')
    }
  })

  it('embedMany returns service unavailable error for generic errors', async () => {
    mockCreate = () => {
      throw new Error('Network error')
    }

    const embedder = new OpenAIEmbedder()
    const result = await embedder.embedMany(['test'])

    expect(isErr(result)).toBe(true)
    if (isErr(result)) {
      expect(result.left).toBeInstanceOf(VErrorExternalServiceUnavailable)
      expect(result.left.message).toContain('OpenAI embeddings API unavailable')
    }
  })

  it('embedMany returns service unavailable error for non-Error objects', async () => {
    mockCreate = () => {
      throw 'Something went wrong'
    }

    const embedder = new OpenAIEmbedder()
    const result = await embedder.embedMany(['test'])

    expect(isErr(result)).toBe(true)
    if (isErr(result)) {
      expect(result.left).toBeInstanceOf(VErrorExternalServiceUnavailable)
    }
  })
})
