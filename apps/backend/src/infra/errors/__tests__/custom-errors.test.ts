// 3rd-party
import { describe, expect, it } from 'vitest'

// internal
import { VERR } from '../common/vogal-error-codes.js'
import {
  VErrorConstraintViolation,
  VErrorFileTooLarge,
  VErrorInvalidContentType,
  VErrorInvalidState,
  VErrorOperationTimeout,
  VErrorProcessingFailed,
  VErrorRateLimited,
} from '../index.js'

// ---------------------------------------------------------------------------------------------------------------------

describe('Custom Vogal Errors', () => {
  describe('VErrorConstraintViolation', () => {
    it('should create error with correct properties', () => {
      const error = new VErrorConstraintViolation({
        message: 'Foreign key constraint failed',
        context: { table: 'users', constraint: 'fk_workspace' },
      })

      expect(error.name).toBe('VErrorConstraintViolation')
      expect(error.message).toBe('Foreign key constraint failed')
      expect(error.getInternalCode()).toBe(VERR.CONSTRAINT_VIOLATION)
      expect(error.getContext()).toEqual({ table: 'users', constraint: 'fk_workspace' })
    })

    it('should use fallback message when message not provided', () => {
      const error = new VErrorConstraintViolation({})
      expect(error.message).toBeDefined()
    })
  })

  describe('VErrorFileTooLarge', () => {
    it('should create error with correct properties', () => {
      const error = new VErrorFileTooLarge({
        message: 'File exceeds 50MB limit',
        context: { size: 52428800, limit: 52428800 },
      })

      expect(error.name).toBe('VErrorFileTooLarge')
      expect(error.message).toBe('File exceeds 50MB limit')
      expect(error.getInternalCode()).toBe(VERR.FILE_TOO_LARGE)
      expect(error.getContext()).toEqual({ size: 52428800, limit: 52428800 })
    })

    it('should use fallback message when message not provided', () => {
      const error = new VErrorFileTooLarge({})
      expect(error.message).toBeDefined()
    })
  })

  describe('VErrorInvalidContentType', () => {
    it('should create error with correct properties', () => {
      const error = new VErrorInvalidContentType({
        message: 'Only PDF files are supported',
        context: { provided: 'image/png', expected: 'application/pdf' },
      })

      expect(error.name).toBe('VErrorInvalidContentType')
      expect(error.message).toBe('Only PDF files are supported')
      expect(error.getInternalCode()).toBe(VERR.INVALID_CONTENT_TYPE)
      expect(error.getContext()).toEqual({ provided: 'image/png', expected: 'application/pdf' })
    })

    it('should use fallback message when message not provided', () => {
      const error = new VErrorInvalidContentType({})
      expect(error.message).toBeDefined()
    })
  })

  describe('VErrorInvalidState', () => {
    it('should create error with correct properties', () => {
      const error = new VErrorInvalidState({
        message: 'Document is not in processable state',
        context: { currentState: 'deleted', expectedState: 'pending' },
      })

      expect(error.name).toBe('VErrorInvalidState')
      expect(error.message).toBe('Document is not in processable state')
      expect(error.getInternalCode()).toBe(VERR.INVALID_STATE)
      expect(error.getContext()).toEqual({ currentState: 'deleted', expectedState: 'pending' })
    })

    it('should use fallback message when message not provided', () => {
      const error = new VErrorInvalidState({})
      expect(error.message).toBeDefined()
    })
  })

  describe('VErrorOperationTimeout', () => {
    it('should create error with correct properties', () => {
      const error = new VErrorOperationTimeout({
        message: 'PDF processing timed out after 30s',
        context: { operation: 'pdf-processing', timeout: 30000 },
      })

      expect(error.name).toBe('VErrorOperationTimeout')
      expect(error.message).toBe('PDF processing timed out after 30s')
      expect(error.getInternalCode()).toBe(VERR.OPERATION_TIMEOUT)
      expect(error.getContext()).toEqual({ operation: 'pdf-processing', timeout: 30000 })
    })

    it('should use fallback message when message not provided', () => {
      const error = new VErrorOperationTimeout({})
      expect(error.message).toBeDefined()
    })
  })

  describe('VErrorProcessingFailed', () => {
    it('should create error with correct properties', () => {
      const error = new VErrorProcessingFailed({
        message: 'Failed to parse PDF document',
        context: { documentId: '123', reason: 'corrupted file' },
      })

      expect(error.name).toBe('VErrorProcessingFailed')
      expect(error.message).toBe('Failed to parse PDF document')
      expect(error.getInternalCode()).toBe(VERR.PROCESSING_FAILED)
      expect(error.getContext()).toEqual({ documentId: '123', reason: 'corrupted file' })
    })

    it('should use fallback message when message not provided', () => {
      const error = new VErrorProcessingFailed({})
      expect(error.message).toBeDefined()
    })
  })

  describe('VErrorRateLimited', () => {
    it('should create error with correct properties', () => {
      const error = new VErrorRateLimited({
        message: 'API rate limit exceeded',
        context: { limit: 100, window: '1m', retryAfter: 60 },
      })

      expect(error.name).toBe('VErrorRateLimited')
      expect(error.message).toBe('API rate limit exceeded')
      expect(error.getInternalCode()).toBe(VERR.RATE_LIMITED)
      expect(error.getContext()).toEqual({ limit: 100, window: '1m', retryAfter: 60 })
    })

    it('should use fallback message when message not provided', () => {
      const error = new VErrorRateLimited({})
      expect(error.message).toBeDefined()
    })

    it('should be instanceof Error', () => {
      const error = new VErrorRateLimited({})
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('Error inheritance and instanceof checks', () => {
    it('all custom errors should be instanceof Error', () => {
      const errors = [
        new VErrorConstraintViolation({}),
        new VErrorFileTooLarge({}),
        new VErrorInvalidContentType({}),
        new VErrorInvalidState({}),
        new VErrorOperationTimeout({}),
        new VErrorProcessingFailed({}),
        new VErrorRateLimited({}),
      ]

      for (const error of errors) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    it('all custom errors should have unique internal codes', () => {
      const errors = [
        new VErrorConstraintViolation({}),
        new VErrorFileTooLarge({}),
        new VErrorInvalidContentType({}),
        new VErrorInvalidState({}),
        new VErrorOperationTimeout({}),
        new VErrorProcessingFailed({}),
        new VErrorRateLimited({}),
      ]

      const codes = errors.map((e) => e.getInternalCode())
      const uniqueCodes = new Set(codes)
      expect(uniqueCodes.size).toBe(codes.length)
    })
  })
})
