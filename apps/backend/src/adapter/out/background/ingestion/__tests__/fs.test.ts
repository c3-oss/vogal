// 3rd-party
import { beforeEach, describe, expect, it, vi } from 'vitest'

// standard
import fs from 'node:fs/promises'

// internal
import { createMockLogger } from '~test/helpers/mock-logger.js'

// internal
import { removeTempFile } from '../fs.js'

// ---------------------------------------------------------------------------------------------------------------------

describe('removeTempFile', () => {
  let mockLogger: ReturnType<typeof createMockLogger>

  beforeEach(() => {
    mockLogger = createMockLogger()
    vi.mock('node:fs/promises', () => ({
      default: {
        unlink: vi.fn(),
      },
    }))
  })

  it('should successfully remove temporary file', async () => {
    // Arrange
    const filePath = '/tmp/test-file.pdf'
    const mockUnlink = vi.mocked(fs.unlink)
    mockUnlink.mockResolvedValue(undefined)

    // Act
    await removeTempFile(filePath, mockLogger)

    // Assert
    expect(mockUnlink).toHaveBeenCalledWith(filePath)
    expect(mockLogger.warn).not.toHaveBeenCalled()
  })

  it('should not log warning when file does not exist (ENOENT)', async () => {
    // Arrange
    const filePath = '/tmp/nonexistent-file.pdf'
    const enoentError = new Error('File not found') as NodeJS.ErrnoException
    enoentError.code = 'ENOENT'
    const mockUnlink = vi.mocked(fs.unlink)
    mockUnlink.mockRejectedValue(enoentError)

    // Act
    await removeTempFile(filePath, mockLogger)

    // Assert
    expect(mockUnlink).toHaveBeenCalledWith(filePath)
    expect(mockLogger.warn).not.toHaveBeenCalled()
  })

  it('should log warning when unlink fails with other error', async () => {
    // Arrange
    const filePath = '/tmp/test-file.pdf'
    const permissionError = new Error('Permission denied') as NodeJS.ErrnoException
    permissionError.code = 'EACCES'
    const mockUnlink = vi.mocked(fs.unlink)
    mockUnlink.mockRejectedValue(permissionError)

    // Act
    await removeTempFile(filePath, mockLogger)

    // Assert
    expect(mockUnlink).toHaveBeenCalledWith(filePath)
    expect(mockLogger.warn).toHaveBeenCalledWith(
      { filePath, error: permissionError },
      'failed to remove temporary upload file',
    )
  })

  it('should log warning when unlink fails with unknown error', async () => {
    // Arrange
    const filePath = '/tmp/test-file.pdf'
    const unknownError = new Error('Unknown error')
    const mockUnlink = vi.mocked(fs.unlink)
    mockUnlink.mockRejectedValue(unknownError)

    // Act
    await removeTempFile(filePath, mockLogger)

    // Assert
    expect(mockUnlink).toHaveBeenCalledWith(filePath)
    expect(mockLogger.warn).toHaveBeenCalledWith(
      { filePath, error: unknownError },
      'failed to remove temporary upload file',
    )
  })
})
