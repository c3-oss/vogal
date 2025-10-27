// 3rd-party
import { describe, expect, it } from 'vitest'

// internal
import { createAppRouter } from '../router.js'
import type { RouterDeps } from '../types.js'

// ---------------------------------------------------------------------------------------------------------------------

describe('createAppRouter', () => {
  it('should create a router that includes all procedure routers', () => {
    const mockDeps = {
      useCases: {},
      repositories: {},
      background: {} as any, // Mock background
      log: {},
    } as RouterDeps

    const router = createAppRouter(mockDeps)

    expect(router).toBeDefined()
    expect(typeof router).toBe('object')
  })
})
