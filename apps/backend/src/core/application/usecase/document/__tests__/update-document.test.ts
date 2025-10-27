// 3rd-party
import { describe, expect, it, vi } from 'vitest'

// c3
import { err, isErr, none, ok, some, val } from '@c3-oss/functional'

// internal
import { createMockLogger } from '~test/helpers/mock-logger.js'
import { UpdateDocumentUseCase } from '../update-document.js'

// ---------------------------------------------------------------------------------------------------------------------

const createMockDependencies = () => ({
  documentRepository: {
    get: vi.fn(),
    update: vi.fn(),
  },
  logger: createMockLogger(),
})

describe('UpdateDocumentUseCase', () => {
  describe('execute', () => {
    it('should update document filename', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const existingDocument = {
        id: 1,
        idExt: 'doc-1',
        workspaceId: 1,
        filename: 'old.pdf',
        contentType: 'application/pdf',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const updatedDocument = { ...existingDocument, filename: 'new.pdf' }

      mockDeps.documentRepository.get.mockResolvedValue(ok(some(existingDocument)) as any)
      mockDeps.documentRepository.update.mockResolvedValue(ok(some(updatedDocument)) as any)

      const useCase = new UpdateDocumentUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ idExt: 'doc-1', filename: 'new.pdf' })

      // Assert
      expect(isErr(result)).toBe(false)
      if (isErr(result)) {
        throw result.left
      }
      expect(val(result)).toEqual(updatedDocument)
      expect(mockDeps.documentRepository.update).toHaveBeenCalledWith('doc-1', { filename: 'new.pdf' })
    })

    it('should return error when filename is empty', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const useCase = new UpdateDocumentUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ idExt: 'doc-1', filename: '' })

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left.message).toBe('Document filename is required')
      }
      expect(mockDeps.documentRepository.get).not.toHaveBeenCalled()
    })

    it('should return not found when document is missing', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      mockDeps.documentRepository.get.mockResolvedValue(ok(none) as any)

      const useCase = new UpdateDocumentUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ idExt: 'doc-1', filename: 'new.pdf' })

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left.message).toBe('Document not found')
      }
      expect(mockDeps.documentRepository.update).not.toHaveBeenCalled()
    })

    it('should skip update when filename is unchanged', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const existingDocument = {
        id: 1,
        idExt: 'doc-1',
        workspaceId: 1,
        filename: 'same.pdf',
        contentType: 'application/pdf',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDeps.documentRepository.get.mockResolvedValue(ok(some(existingDocument)) as any)

      const useCase = new UpdateDocumentUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ idExt: 'doc-1', filename: 'same.pdf' })

      // Assert
      expect(isErr(result)).toBe(false)
      if (isErr(result)) {
        throw result.left
      }
      expect(val(result)).toEqual(existingDocument)
      expect(mockDeps.documentRepository.update).not.toHaveBeenCalled()
    })

    it('should propagate repository update errors', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const existingDocument = {
        id: 1,
        idExt: 'doc-1',
        workspaceId: 1,
        filename: 'old.pdf',
        contentType: 'application/pdf',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDeps.documentRepository.get.mockResolvedValue(ok(some(existingDocument)) as any)
      mockDeps.documentRepository.update.mockResolvedValue(err(new Error('db error')) as any)

      const useCase = new UpdateDocumentUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ idExt: 'doc-1', filename: 'new.pdf' })

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left.message).toBe('db error')
      }
    })

    it('should return not found when repository update yields none', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const existingDocument = {
        id: 1,
        idExt: 'doc-1',
        workspaceId: 1,
        filename: 'old.pdf',
        contentType: 'application/pdf',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDeps.documentRepository.get.mockResolvedValue(ok(some(existingDocument)) as any)
      mockDeps.documentRepository.update.mockResolvedValue(ok(none) as any)

      const useCase = new UpdateDocumentUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ idExt: 'doc-1', filename: 'new.pdf' })

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left.message).toBe('Document not found')
      }
    })
  })
})
