// 3rd-party
import { describe, expect, it, vi } from 'vitest'

// c3
import { isNone, isSome, none, ok, some } from '@c3-oss/functional'

// internal
import { createMockLogger } from '~test/helpers/mock-logger.js'

// internal
import { DeleteWorkspaceUseCase } from '../delete-workspace.js'

// ---------------------------------------------------------------------------------------------------------------------

const createMockDependencies = () => ({
  workspaceRepository: {
    create: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(),
    getByUser: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
  repository: {
    initCollection: vi.fn(),
    deleteCollection: vi.fn(),
    upsert: vi.fn(),
    deleteDocumentVectors: vi.fn(),
    search: vi.fn(),
    listDocuments: vi.fn(),
  },
  logger: createMockLogger(),
})

describe('DeleteWorkspaceUseCase', () => {
  describe('execute', () => {
    it('should delete workspace successfully', async () => {
      // Arrange
      const mockDeps = createMockDependencies()

      const mockWorkspace = {
        id: 1,
        idExt: 'workspace-123',
        name: 'My Workspace',
        userId: 1,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDeps.workspaceRepository.get.mockResolvedValue(ok(some(mockWorkspace)))
      mockDeps.workspaceRepository.delete.mockResolvedValue(none)
      mockDeps.repository.deleteCollection.mockResolvedValue(none)

      const useCase = new DeleteWorkspaceUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ idExt: 'workspace-123' })

      // Assert
      expect(isNone(result)).toBe(true)
      expect(mockDeps.workspaceRepository.get).toHaveBeenCalledWith('workspace-123')
      expect(mockDeps.repository.deleteCollection).toHaveBeenCalledWith('workspace-123')
      expect(mockDeps.workspaceRepository.delete).toHaveBeenCalledWith('workspace-123')
    })

    it('should return error when workspace not found', async () => {
      // Arrange
      const mockDeps = createMockDependencies()

      mockDeps.workspaceRepository.get.mockResolvedValue(ok(none))
      mockDeps.repository.deleteCollection.mockResolvedValue(none)

      const useCase = new DeleteWorkspaceUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ idExt: 'nonexistent' })

      // Assert
      expect(isSome(result)).toBe(true)
      if (isSome(result)) {
        expect(result.value.message).toBe('Workspace not found')
      }

      expect(mockDeps.workspaceRepository.get).toHaveBeenCalledWith('nonexistent')
      expect(mockDeps.workspaceRepository.delete).not.toHaveBeenCalled()
      expect(mockDeps.repository.deleteCollection).not.toHaveBeenCalled()
    })
  })
})
