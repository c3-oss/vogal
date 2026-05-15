// 3rd-party
import { describe, expect, it } from 'vitest'

// internal
import { getNextPendingStep, getStepIndex, hasCompleted } from '../progression.js'
import type { DocumentUploadDTO } from '../types.js'

// ---------------------------------------------------------------------------------------------------------------------

const createMockState = (overrides: Partial<DocumentUploadDTO> = {}): DocumentUploadDTO => ({
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
  currentStep: 'pending',
  lastCompletedStep: 'pending',
  retryCount: 0,
  errorMessage: null,
  startedAt: new Date(),
  finishedAt: null,
  heartbeatAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

describe('getStepIndex', () => {
  it('should return correct index for each step', () => {
    expect(getStepIndex('pending')).toBe(0)
    expect(getStepIndex('storage_upload')).toBe(1)
    expect(getStepIndex('file_reference')).toBe(2)
    expect(getStepIndex('content_indexed')).toBe(3)
    expect(getStepIndex('finalized')).toBe(4)
  })

  it('should return 0 for undefined step', () => {
    expect(getStepIndex(undefined)).toBe(0)
  })

  it('should return 0 for null step', () => {
    expect(getStepIndex(null)).toBe(0)
  })
})

describe('hasCompleted', () => {
  it('should return false when lastCompletedStep is before given step', () => {
    // Arrange
    const state = createMockState({ lastCompletedStep: 'pending' })

    // Act & Assert
    expect(hasCompleted(state, 'storage_upload')).toBe(false)
    expect(hasCompleted(state, 'file_reference')).toBe(false)
    expect(hasCompleted(state, 'content_indexed')).toBe(false)
    expect(hasCompleted(state, 'finalized')).toBe(false)
  })

  it('should return true when lastCompletedStep is same as given step', () => {
    // Arrange
    const state = createMockState({ lastCompletedStep: 'storage_upload' })

    // Act & Assert
    expect(hasCompleted(state, 'pending')).toBe(true)
    expect(hasCompleted(state, 'storage_upload')).toBe(true)
    expect(hasCompleted(state, 'file_reference')).toBe(false)
    expect(hasCompleted(state, 'content_indexed')).toBe(false)
    expect(hasCompleted(state, 'finalized')).toBe(false)
  })

  it('should return true when lastCompletedStep is after given step', () => {
    // Arrange
    const state = createMockState({ lastCompletedStep: 'content_indexed' })

    // Act & Assert
    expect(hasCompleted(state, 'pending')).toBe(true)
    expect(hasCompleted(state, 'storage_upload')).toBe(true)
    expect(hasCompleted(state, 'file_reference')).toBe(true)
    expect(hasCompleted(state, 'content_indexed')).toBe(true)
    expect(hasCompleted(state, 'finalized')).toBe(false)
  })

  it('should return true when lastCompletedStep is finalized', () => {
    // Arrange
    const state = createMockState({ lastCompletedStep: 'finalized' })

    // Act & Assert
    expect(hasCompleted(state, 'pending')).toBe(true)
    expect(hasCompleted(state, 'storage_upload')).toBe(true)
    expect(hasCompleted(state, 'file_reference')).toBe(true)
    expect(hasCompleted(state, 'content_indexed')).toBe(true)
    expect(hasCompleted(state, 'finalized')).toBe(true)
  })

  it('should handle null lastCompletedStep', () => {
    // Arrange
    const state = createMockState({ lastCompletedStep: null })

    // Act & Assert
    expect(hasCompleted(state, 'pending')).toBe(true)
    expect(hasCompleted(state, 'storage_upload')).toBe(false)
    expect(hasCompleted(state, 'file_reference')).toBe(false)
    expect(hasCompleted(state, 'content_indexed')).toBe(false)
    expect(hasCompleted(state, 'finalized')).toBe(false)
  })
})

describe('getNextPendingStep', () => {
  it('should return first step when no steps are completed', () => {
    // Arrange
    const state = createMockState({ lastCompletedStep: 'pending' })

    // Act
    const result = getNextPendingStep(state)

    // Assert
    expect(result).toBe('storage_upload')
  })

  it('should return next step when some steps are completed', () => {
    // Arrange
    const state = createMockState({ lastCompletedStep: 'storage_upload' })

    // Act
    const result = getNextPendingStep(state)

    // Assert
    expect(result).toBe('file_reference')
  })

  it('should return content_indexed when file_reference is completed', () => {
    // Arrange
    const state = createMockState({ lastCompletedStep: 'file_reference' })

    // Act
    const result = getNextPendingStep(state)

    // Assert
    expect(result).toBe('content_indexed')
  })

  it('should return finalized when content_indexed is completed', () => {
    // Arrange
    const state = createMockState({ lastCompletedStep: 'content_indexed' })

    // Act
    const result = getNextPendingStep(state)

    // Assert
    expect(result).toBe('finalized')
  })

  it('should return finalized when all steps are completed', () => {
    // Arrange
    const state = createMockState({ lastCompletedStep: 'finalized' })

    // Act
    const result = getNextPendingStep(state)

    // Assert
    expect(result).toBe('finalized')
  })

  it('should return storage_upload when lastCompletedStep is null', () => {
    // Arrange
    const state = createMockState({ lastCompletedStep: null })

    // Act
    const result = getNextPendingStep(state)

    // Assert
    expect(result).toBe('storage_upload')
  })
})
