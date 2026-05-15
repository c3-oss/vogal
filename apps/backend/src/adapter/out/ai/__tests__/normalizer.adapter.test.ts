// 3rd-party
import { describe, expect, it, vi } from 'vitest'

// internal
import { OpenAINormalizer } from '../normalizer.adapter.js'

// ---------------------------------------------------------------------------------------------------------------------

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(function OpenAI() {
    return {
      chat: { completions: { create: vi.fn().mockRejectedValue(new Error('fail')) } },
    }
  }),
}))

describe('OpenAINormalizer', () => {
  it('returns err(error) when client throws', async () => {
    const n = new OpenAINormalizer()
    const res = await n.normalize('text')
    // narrow by checking discriminated union using in-operator
    expect('left' in res).toBe(true)
  })
})
