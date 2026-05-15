// 3rd-party
import { beforeEach, describe, expect, it, vi } from 'vitest'

// c3
import { err, isSome, none, ok, some } from '@c3-oss/functional'

// internal
import { createMockLogger } from '~test/helpers/mock-logger.js'

import type { DocumentUploadDTO } from '../../types.js'
// internal
import { finalizeSuccess } from '../finalize-success.js'

// ---------------------------------------------------------------------------------------------------------------------

const createMockState = (): DocumentUploadDTO => ({
  id: 1,
  documentIdExt: 'doc-123',
  jobIdExt: 'job-123',
  documentId: 1,
  workspaceId: 1,
  workspaceIdExt: 'workspace-123',
  filename: 'test.pdf',
  contentType: 'application/pdf',
  tempFilePath: '/tmp/test.pdf',
  storageProvider: 's3',
  storageBucket: 'test-bucket',
  storageObjectKey: 'test-key',
  status: 'processing',
  currentStep: 'content_indexed',
  lastCompletedStep: 'content_indexed',
  retryCount: 0,
  errorMessage: null,
  startedAt: new Date(),
  finishedAt: null,
  heartbeatAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
})

describe('finalizeSuccess', () => {
  let mockDeps: any
  let mockState: DocumentUploadDTO

  beforeEach(() => {
    mockDeps = {
      logger: createMockLogger(),
      writer: {
        updateDocument: vi.fn(),
      },
      uploads: {
        updateById: vi.fn(),
      },
    }
    mockState = createMockState()
  })

  it('should finalize successfully when both updates succeed', async () => {
    // Arrange
    mockDeps.writer.updateDocument.mockResolvedValue(ok(undefined))
    mockDeps.uploads.updateById.mockResolvedValue(none)

    // Act
    const result = await finalizeSuccess(mockState, mockDeps)

    // Assert
    expect(result).toBe(none)
    expect(mockDeps.logger.info).toHaveBeenCalledWith(
      { jobId: 'job-123', documentIdExt: 'doc-123' },
      'saga: finalizing successful ingestion',
    )
    expect(mockDeps.writer.updateDocument).toHaveBeenCalledWith('doc-123', {
      status: 'ready',
      failureReason: null,
    })
    expect(mockDeps.uploads.updateById).toHaveBeenCalledWith(1, {
      status: 'completed',
      lastCompletedStep: 'finalized',
      currentStep: 'finalized',
      finishedAt: expect.any(Date),
      heartbeatAt: expect.any(Date),
      errorMessage: null,
    })
    expect(mockDeps.logger.info).toHaveBeenCalledWith(
      { jobId: 'job-123', documentIdExt: 'doc-123' },
      'saga: ingestion completed successfully',
    )
  })

  it('should return error when document update fails with Error', async () => {
    // Arrange
    const updateError = new Error('Document update failed')
    mockDeps.writer.updateDocument.mockResolvedValue(err(updateError))
    mockDeps.uploads.updateById.mockResolvedValue(none)

    // Act
    const result = await finalizeSuccess(mockState, mockDeps)

    // Assert
    expect(result).toStrictEqual(some(updateError))
    expect(mockDeps.writer.updateDocument).toHaveBeenCalledWith('doc-123', {
      status: 'ready',
      failureReason: null,
    })
    expect(mockDeps.uploads.updateById).not.toHaveBeenCalled()
    expect(mockDeps.logger.info).toHaveBeenCalledWith(
      { jobId: 'job-123', documentIdExt: 'doc-123' },
      'saga: finalizing successful ingestion',
    )
    expect(mockDeps.logger.info).not.toHaveBeenCalledWith(
      { jobId: 'job-123', documentIdExt: 'doc-123' },
      'saga: ingestion completed successfully',
    )
  })

  it('should return VErrorUnknown when document update fails with non-Error', async () => {
    // Arrange
    const updateError = { message: 'Non-error object' }
    mockDeps.writer.updateDocument.mockResolvedValue(err(updateError))
    mockDeps.uploads.updateById.mockResolvedValue(none)

    // Act
    const result = await finalizeSuccess(mockState, mockDeps)

    // Assert
    expect(isSome(result)).toBe(true)
    if (isSome(result)) {
      expect(result.value).toBeInstanceOf(Error)
      // The error message is JSON.stringify of the non-error object
      expect(result.value.message).toBe('{"message":"Non-error object"}')
    }
    expect(mockDeps.writer.updateDocument).toHaveBeenCalledWith('doc-123', {
      status: 'ready',
      failureReason: null,
    })
    expect(mockDeps.uploads.updateById).not.toHaveBeenCalled()
  })

  it('should return error when upload update fails', async () => {
    // Arrange
    const uploadError = new Error('Upload update failed')
    mockDeps.writer.updateDocument.mockResolvedValue(ok(undefined))
    mockDeps.uploads.updateById.mockResolvedValue(some(uploadError))

    // Act
    const result = await finalizeSuccess(mockState, mockDeps)

    // Assert
    expect(result).toStrictEqual(some(uploadError))
    expect(mockDeps.writer.updateDocument).toHaveBeenCalledWith('doc-123', {
      status: 'ready',
      failureReason: null,
    })
    expect(mockDeps.uploads.updateById).toHaveBeenCalledWith(1, {
      status: 'completed',
      lastCompletedStep: 'finalized',
      currentStep: 'finalized',
      finishedAt: expect.any(Date),
      heartbeatAt: expect.any(Date),
      errorMessage: null,
    })
    expect(mockDeps.logger.info).toHaveBeenCalledWith(
      { jobId: 'job-123', documentIdExt: 'doc-123' },
      'saga: finalizing successful ingestion',
    )
    expect(mockDeps.logger.info).not.toHaveBeenCalledWith(
      { jobId: 'job-123', documentIdExt: 'doc-123' },
      'saga: ingestion completed successfully',
    )
  })
})
