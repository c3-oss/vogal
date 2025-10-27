// 3rd-party
import { describe, expect, it, vi } from 'vitest'

// internal
import type { DB } from '~out/db/pgconn.js'
import { createMockLogger } from '~test/helpers/mock-logger.js'
import { GetHealthStatusUseCase } from '../get-health-status.js'

// ---------------------------------------------------------------------------------------------------------------------

const createDeps = () => {
  const executeMock = vi.fn().mockResolvedValue(undefined)
  const db = { execute: executeMock } as Pick<DB, 'execute'>
  const logger = createMockLogger()

  return {
    db,
    logger,
    now: () => new Date('2024-01-01T00:00:00.000Z'),
    uptime: () => 42.7,
    memoryUsage: () =>
      ({
        rss: 1000,
        heapUsed: 2000,
        heapTotal: 3000,
        external: 400,
        arrayBuffers: 0,
      }) as NodeJS.MemoryUsage,
    version: '1.2.3',
    executeMock,
  }
}

describe('GetHealthStatusUseCase', () => {
  it('should return ok status when database check succeeds', async () => {
    // Arrange
    const deps = createDeps()
    const useCase = new GetHealthStatusUseCase(deps)

    // Act
    const result = await useCase.execute()

    // Assert
    expect(deps.executeMock).toHaveBeenCalledTimes(1)
    expect(result.status).toBe('ok')
    expect(result.timestamp).toBe('2024-01-01T00:00:00.000Z')
    expect(result.uptimeSeconds).toBe(43)
    expect(result.version).toBe('1.2.3')
    expect(result.metrics.memory.heapUsed).toBe(2000)
    expect(result.dependencies.database.status).toBe('ok')
    expect(result.dependencies.database.latencyMs).toBeDefined()
  })

  it('should mark overall status as error when database check fails', async () => {
    // Arrange
    const deps = createDeps()
    const error = new Error('db down')
    deps.executeMock.mockRejectedValue(error)
    const useCase = new GetHealthStatusUseCase(deps)

    // Act
    const result = await useCase.execute()

    // Assert
    expect(deps.executeMock).toHaveBeenCalledTimes(1)
    expect(result.status).toBe('error')
    expect(result.dependencies.database.status).toBe('error')
    expect(result.dependencies.database.error).toBe('db down')
  })
})
