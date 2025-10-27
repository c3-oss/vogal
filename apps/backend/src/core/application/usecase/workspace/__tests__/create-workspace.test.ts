// 3rd-party
import { describe, expect, it, vi } from 'vitest'

// c3
import { isErr, none, ok, some, val } from '@c3-oss/functional'

// internal
import { createMockLogger } from '~test/helpers/mock-logger.js'

// internal
import { CreateWorkspaceUseCase } from '../create-workspace.js'

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
  userRepository: {
    create: vi.fn(),
    get: vi.fn(),
    getByEmail: vi.fn(),
    getAll: vi.fn(),
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

describe('CreateWorkspaceUseCase', () => {
  describe('execute', () => {
    it('should create a new workspace successfully', async () => {
      // Arrange
      const mockDeps = createMockDependencies()

      const mockUser = {
        id: 1,
        idExt: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDeps.userRepository.get.mockResolvedValue(ok(some(mockUser)))
      mockDeps.workspaceRepository.create.mockResolvedValue(ok('workspace-123'))
      mockDeps.repository.initCollection.mockResolvedValue(none)

      const useCase = new CreateWorkspaceUseCase(mockDeps)

      // Act
      const result = await useCase.execute({
        name: 'My Workspace',
        userId: 'user-123',
      })

      // Assert
      if (isErr(result)) {
        throw result.left
      }
      expect(val(result)).toBe('workspace-123')
      expect(mockDeps.userRepository.get).toHaveBeenCalledWith('user-123')
      expect(mockDeps.workspaceRepository.create).toHaveBeenCalledWith({
        name: 'My Workspace',
        userId: 1,
      })
      expect(mockDeps.repository.initCollection).toHaveBeenCalledWith('workspace-123')
    })

    it('should return error when user not found', async () => {
      // Arrange
      const mockDeps = createMockDependencies()

      mockDeps.userRepository.get.mockResolvedValue(ok(none))
      mockDeps.repository.initCollection.mockResolvedValue(none)

      const useCase = new CreateWorkspaceUseCase(mockDeps)

      // Act
      const result = await useCase.execute({
        name: 'My Workspace',
        userId: 'nonexistent',
      })

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left.message).toBe('User not found')
      }

      expect(mockDeps.userRepository.get).toHaveBeenCalledWith('nonexistent')
      expect(mockDeps.workspaceRepository.create).not.toHaveBeenCalled()
      expect(mockDeps.repository.initCollection).not.toHaveBeenCalled()
    })
  })
})
