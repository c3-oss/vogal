// 3rd-party
import { describe, expect, it, vi } from 'vitest'

// internal
import { createGenericBreaker } from '../circuit-breaker.js'

// ---------------------------------------------------------------------------------------------------------------------

describe('createGenericBreaker', () => {
  describe('when disabled', () => {
    it('should execute function directly', async () => {
      // Arrange
      const mockFn = vi.fn().mockResolvedValue('success')
      const breaker = createGenericBreaker({ enabled: false })

      // Act
      const result = await breaker.fire(mockFn)

      // Assert
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should propagate errors directly', async () => {
      // Arrange
      const mockError = new Error('Test error')
      const mockFn = vi.fn().mockRejectedValue(mockError)
      const breaker = createGenericBreaker({ enabled: false })

      // Act & Assert
      await expect(breaker.fire(mockFn)).rejects.toThrow('Test error')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('when enabled', () => {
    it('should execute function through circuit breaker', async () => {
      // Arrange
      const mockFn = vi.fn().mockResolvedValue('success')
      const breaker = createGenericBreaker({ enabled: true })

      // Act
      const result = await breaker.fire(mockFn)

      // Assert
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should use default options when none provided', async () => {
      // Arrange
      const mockFn = vi.fn().mockResolvedValue('success')
      const breaker = createGenericBreaker()

      // Act
      const result = await breaker.fire(mockFn)

      // Assert
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should merge custom options with defaults', async () => {
      // Arrange
      const mockFn = vi.fn().mockResolvedValue('success')
      const breaker = createGenericBreaker({
        enabled: true,
        timeout: 5000,
        errorThresholdPercentage: 75,
      })

      // Act
      const result = await breaker.fire(mockFn)

      // Assert
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should handle async functions correctly', async () => {
      // Arrange
      const mockFn = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return 'async result'
      })
      const breaker = createGenericBreaker({ enabled: true })

      // Act
      const result = await breaker.fire(mockFn)

      // Assert
      expect(result).toBe('async result')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })
})
