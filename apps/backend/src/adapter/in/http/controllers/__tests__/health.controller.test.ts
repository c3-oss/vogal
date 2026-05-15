// 3rd-party
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { GetHealthStatusUseCase } from '~core/application/usecase/health/get-health-status.js'
// internal
import { HealthController } from '../health.controller.js'

// ---------------------------------------------------------------------------------------------------------------------

describe('HealthController', () => {
  let mockGetHealthStatus: GetHealthStatusUseCase
  let controller: HealthController
  let mockRequest: any
  let mockReply: any

  beforeEach(() => {
    mockGetHealthStatus = {
      execute: vi.fn().mockResolvedValue({
        status: 'ok' as const,
        timestamp: new Date().toISOString(),
        uptimeSeconds: 100,
        environment: 'test',
        version: '1.0.0',
        dependencies: {
          database: { status: 'ok' as const, latencyMs: 10 },
        },
        metrics: {
          memory: {
            rss: 1000000,
            heapUsed: 500000,
            heapTotal: 1000000,
            external: 100000,
          },
        },
      }),
    } as any

    controller = new HealthController({ getHealthStatus: mockGetHealthStatus })

    mockRequest = {}
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    }
  })

  it('should create controller successfully', () => {
    expect(controller).toBeDefined()
  })

  describe('handle', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should return 200 when health status is ok', async () => {
      // Arrange
      const healthData = {
        status: 'ok' as const,
        timestamp: new Date().toISOString(),
        uptimeSeconds: 100,
        environment: 'test',
        version: '1.0.0',
        dependencies: {
          database: { status: 'ok' as const, latencyMs: 10 },
        },
        metrics: {
          memory: {
            rss: 1000000,
            heapUsed: 500000,
            heapTotal: 1000000,
            external: 100000,
          },
        },
      }
      vi.mocked(mockGetHealthStatus.execute).mockResolvedValue(healthData)

      // Act
      await controller.handle(mockRequest, mockReply)

      // Assert
      expect(mockGetHealthStatus.execute).toHaveBeenCalled()
      expect(mockReply.status).toHaveBeenCalledWith(200)
      expect(mockReply.send).toHaveBeenCalledWith(healthData)
    })

    it('should return 503 when health status is not ok', async () => {
      // Arrange
      const healthData = {
        status: 'error' as const,
        timestamp: new Date().toISOString(),
        uptimeSeconds: 100,
        environment: 'test',
        version: '1.0.0',
        dependencies: {
          database: { status: 'error' as const, error: 'Connection failed' },
        },
        metrics: {
          memory: {
            rss: 1000000,
            heapUsed: 500000,
            heapTotal: 1000000,
            external: 100000,
          },
        },
      }
      vi.mocked(mockGetHealthStatus.execute).mockResolvedValue(healthData)

      // Act
      await controller.handle(mockRequest, mockReply)

      // Assert
      expect(mockGetHealthStatus.execute).toHaveBeenCalled()
      expect(mockReply.status).toHaveBeenCalledWith(503)
      expect(mockReply.send).toHaveBeenCalledWith(healthData)
    })

    it('should return 503 when health status is degraded', async () => {
      // Arrange
      const healthData = {
        status: 'degraded' as const,
        timestamp: new Date().toISOString(),
        uptimeSeconds: 100,
        environment: 'test',
        version: '1.0.0',
        dependencies: {
          database: { status: 'ok' as const, latencyMs: 50 },
        },
        metrics: {
          memory: {
            rss: 1000000,
            heapUsed: 500000,
            heapTotal: 1000000,
            external: 100000,
          },
        },
      }
      vi.mocked(mockGetHealthStatus.execute).mockResolvedValue(healthData)

      // Act
      await controller.handle(mockRequest, mockReply)

      // Assert
      expect(mockGetHealthStatus.execute).toHaveBeenCalled()
      expect(mockReply.status).toHaveBeenCalledWith(503)
      expect(mockReply.send).toHaveBeenCalledWith(healthData)
    })
  })
})
