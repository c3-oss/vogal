// 3rd-party
import { describe, expect, it, vi } from 'vitest'

// c3
import { none, some } from '@c3-oss/functional'

// internal
import { createMockLogger } from '~test/helpers/mock-logger.js'

// internal
import { safeRemoveRemoteFile } from '../storage.js'

// ---------------------------------------------------------------------------------------------------------------------

describe('safeRemoveRemoteFile', () => {
  it('should return early when bucket is missing', async () => {
    // Arrange
    const mockStorage = {
      upload: vi.fn(),
      remove: vi.fn(),
    }
    const mockLogger = createMockLogger()

    // Act
    await safeRemoveRemoteFile(mockStorage, mockLogger, undefined, 'object-key')

    // Assert
    expect(mockStorage.remove).not.toHaveBeenCalled()
  })

  it('should return early when objectKey is missing', async () => {
    // Arrange
    const mockStorage = {
      upload: vi.fn(),
      remove: vi.fn(),
    }
    const mockLogger = createMockLogger()

    // Act
    await safeRemoveRemoteFile(mockStorage, mockLogger, 'bucket-name', undefined)

    // Assert
    expect(mockStorage.remove).not.toHaveBeenCalled()
  })

  it('should return early when both bucket and objectKey are missing', async () => {
    // Arrange
    const mockStorage = {
      upload: vi.fn(),
      remove: vi.fn(),
    }
    const mockLogger = createMockLogger()

    // Act
    await safeRemoveRemoteFile(mockStorage, mockLogger, undefined, undefined)

    // Assert
    expect(mockStorage.remove).not.toHaveBeenCalled()
  })

  it('should call storage.remove when both bucket and objectKey are provided', async () => {
    // Arrange
    const mockStorage = {
      upload: vi.fn(),
      remove: vi.fn().mockResolvedValue(none),
    }
    const mockLogger = createMockLogger()

    // Act
    await safeRemoveRemoteFile(mockStorage, mockLogger, 'bucket-name', 'object-key')

    // Assert
    expect(mockStorage.remove).toHaveBeenCalledWith({
      bucket: 'bucket-name',
      objectKey: 'object-key',
    })
    expect(mockLogger.warn).not.toHaveBeenCalled()
  })

  it('should log warning when storage.remove returns error', async () => {
    // Arrange
    const mockError = new Error('Storage removal failed')
    const mockStorage = {
      upload: vi.fn(),
      remove: vi.fn().mockResolvedValue(some(mockError)),
    }
    const mockLogger = createMockLogger()

    // Act
    await safeRemoveRemoteFile(mockStorage, mockLogger, 'bucket-name', 'object-key')

    // Assert
    expect(mockStorage.remove).toHaveBeenCalledWith({
      bucket: 'bucket-name',
      objectKey: 'object-key',
    })
    expect(mockLogger.warn).toHaveBeenCalledWith(
      {
        bucket: 'bucket-name',
        objectKey: 'object-key',
        error: mockError,
      },
      'compensation: failed to remove file from remote storage',
    )
  })

  it('should handle empty string bucket', async () => {
    // Arrange
    const mockStorage = {
      upload: vi.fn(),
      remove: vi.fn(),
    }
    const mockLogger = createMockLogger()

    // Act
    await safeRemoveRemoteFile(mockStorage, mockLogger, '', 'object-key')

    // Assert
    expect(mockStorage.remove).not.toHaveBeenCalled()
  })

  it('should handle empty string objectKey', async () => {
    // Arrange
    const mockStorage = {
      upload: vi.fn(),
      remove: vi.fn(),
    }
    const mockLogger = createMockLogger()

    // Act
    await safeRemoveRemoteFile(mockStorage, mockLogger, 'bucket-name', '')

    // Assert
    expect(mockStorage.remove).not.toHaveBeenCalled()
  })
})
