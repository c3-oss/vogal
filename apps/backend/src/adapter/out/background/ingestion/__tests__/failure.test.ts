// 3rd-party
import { beforeEach, describe, expect, it, vi } from 'vitest'

// c3
import { err, none, ok, some } from '@c3-oss/functional'

// internal
import { createMockLogger } from '~test/helpers/mock-logger.js'

// internal
import { handleFailure } from '../failure.js'
import type { DocumentUploadDTO } from '../types.js'

// Mock the compensations module
vi.mock('../compensations.js', () => ({
  runCompensations: vi.fn().mockResolvedValue(undefined),
}))

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
  currentStep: 'storage_upload',
  lastCompletedStep: 'pending',
  retryCount: 0,
  errorMessage: null,
  startedAt: new Date(),
  finishedAt: null,
  heartbeatAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
})

describe('handleFailure', () => {
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
      storage: {
        upload: vi.fn(),
        remove: vi.fn(),
      },
      vectorRepository: {
        upsert: vi.fn(),
        remove: vi.fn(),
      },
    }
    mockState = createMockState()
  })

  it('should handle failure successfully', async () => {
    // Arrange
    const mockError = new Error('Test error')
    mockDeps.writer.updateDocument.mockResolvedValue(ok(undefined))
    mockDeps.uploads.updateById.mockResolvedValue(none)

    // Act
    await handleFailure(mockState, mockError, mockDeps)

    // Assert
    expect(mockDeps.logger.error).toHaveBeenCalledWith(
      { jobId: 'job-123', documentIdExt: 'doc-123', error: mockError },
      'saga: ingestion failed, executing compensations',
    )
    expect(mockDeps.writer.updateDocument).toHaveBeenCalledWith('doc-123', {
      status: 'failed',
      failureReason: 'Test error',
    })
    expect(mockDeps.uploads.updateById).toHaveBeenCalledWith(1, {
      status: 'failed',
      errorMessage: 'Test error',
      finishedAt: expect.any(Date),
      heartbeatAt: expect.any(Date),
    })
    expect(mockDeps.logger.error).toHaveBeenCalledTimes(1) // Only the initial error log
  })

  it('should handle failure when document update fails', async () => {
    // Arrange
    const mockError = new Error('Test error')
    const updateError = new Error('Document update failed')
    mockDeps.writer.updateDocument.mockResolvedValue(err(updateError))
    mockDeps.uploads.updateById.mockResolvedValue(none)

    // Act
    await handleFailure(mockState, mockError, mockDeps)

    // Assert
    expect(mockDeps.logger.error).toHaveBeenCalledWith(
      { jobId: 'job-123', documentIdExt: 'doc-123', error: mockError },
      'saga: ingestion failed, executing compensations',
    )
    expect(mockDeps.writer.updateDocument).toHaveBeenCalledWith('doc-123', {
      status: 'failed',
      failureReason: 'Test error',
    })
    expect(mockDeps.logger.error).toHaveBeenCalledWith(
      { documentIdExt: 'doc-123', error: updateError },
      'failed to update document status',
    )
    expect(mockDeps.uploads.updateById).toHaveBeenCalledWith(1, {
      status: 'failed',
      errorMessage: 'Test error',
      finishedAt: expect.any(Date),
      heartbeatAt: expect.any(Date),
    })
  })

  it('should handle failure when upload update fails', async () => {
    // Arrange
    const mockError = new Error('Test error')
    const uploadError = new Error('Upload update failed')
    mockDeps.writer.updateDocument.mockResolvedValue(ok(undefined))
    mockDeps.uploads.updateById.mockResolvedValue(some(uploadError))

    // Act
    await handleFailure(mockState, mockError, mockDeps)

    // Assert
    expect(mockDeps.logger.error).toHaveBeenCalledWith(
      { jobId: 'job-123', documentIdExt: 'doc-123', error: mockError },
      'saga: ingestion failed, executing compensations',
    )
    expect(mockDeps.writer.updateDocument).toHaveBeenCalledWith('doc-123', {
      status: 'failed',
      failureReason: 'Test error',
    })
    expect(mockDeps.uploads.updateById).toHaveBeenCalledWith(1, {
      status: 'failed',
      errorMessage: 'Test error',
      finishedAt: expect.any(Date),
      heartbeatAt: expect.any(Date),
    })
    expect(mockDeps.logger.error).toHaveBeenCalledWith(
      { jobId: 'job-123', error: uploadError },
      'failed to persist upload failure state',
    )
  })

  it('should handle failure when both document and upload updates fail', async () => {
    // Arrange
    const mockError = new Error('Test error')
    const updateError = new Error('Document update failed')
    const uploadError = new Error('Upload update failed')
    mockDeps.writer.updateDocument.mockResolvedValue(err(updateError))
    mockDeps.uploads.updateById.mockResolvedValue(some(uploadError))

    // Act
    await handleFailure(mockState, mockError, mockDeps)

    // Assert
    expect(mockDeps.logger.error).toHaveBeenCalledWith(
      { jobId: 'job-123', documentIdExt: 'doc-123', error: mockError },
      'saga: ingestion failed, executing compensations',
    )
    expect(mockDeps.writer.updateDocument).toHaveBeenCalledWith('doc-123', {
      status: 'failed',
      failureReason: 'Test error',
    })
    expect(mockDeps.logger.error).toHaveBeenCalledWith(
      { documentIdExt: 'doc-123', error: updateError },
      'failed to update document status',
    )
    expect(mockDeps.uploads.updateById).toHaveBeenCalledWith(1, {
      status: 'failed',
      errorMessage: 'Test error',
      finishedAt: expect.any(Date),
      heartbeatAt: expect.any(Date),
    })
    expect(mockDeps.logger.error).toHaveBeenCalledWith(
      { jobId: 'job-123', error: uploadError },
      'failed to persist upload failure state',
    )
  })

  it('should handle string error', async () => {
    // Arrange
    const mockError = 'String error message'
    mockDeps.writer.updateDocument.mockResolvedValue(ok(undefined))
    mockDeps.uploads.updateById.mockResolvedValue(none)

    // Act
    await handleFailure(mockState, mockError, mockDeps)

    // Assert
    expect(mockDeps.writer.updateDocument).toHaveBeenCalledWith('doc-123', {
      status: 'failed',
      failureReason: 'String error message',
    })
    expect(mockDeps.uploads.updateById).toHaveBeenCalledWith(1, {
      status: 'failed',
      errorMessage: 'String error message',
      finishedAt: expect.any(Date),
      heartbeatAt: expect.any(Date),
    })
  })

  it('should handle object error', async () => {
    // Arrange
    const mockError = { message: 'Object error', code: 500 }
    mockDeps.writer.updateDocument.mockResolvedValue(ok(undefined))
    mockDeps.uploads.updateById.mockResolvedValue(none)

    // Act
    await handleFailure(mockState, mockError, mockDeps)

    // Assert
    expect(mockDeps.writer.updateDocument).toHaveBeenCalledWith('doc-123', {
      status: 'failed',
      failureReason: 'Unknown ingestion failure',
    })
    expect(mockDeps.uploads.updateById).toHaveBeenCalledWith(1, {
      status: 'failed',
      errorMessage: 'Unknown ingestion failure',
      finishedAt: expect.any(Date),
      heartbeatAt: expect.any(Date),
    })
  })
})
