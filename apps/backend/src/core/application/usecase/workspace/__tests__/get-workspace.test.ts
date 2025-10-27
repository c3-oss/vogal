// 3rd-party
import { describe, expect, it, vi } from 'vitest'

// c3
import { none, ok, some } from '@c3-oss/functional'

// internal
import { createMockLogger } from '~test/helpers/mock-logger.js'

// internal
import { GetWorkspaceUseCase } from '../get-workspace.js'

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
  logger: createMockLogger(),
})

describe('GetWorkspaceUseCase', () => {
  describe('execute', () => {
    it('should return workspace when found', async () => {
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

      const useCase = new GetWorkspaceUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ idExt: 'workspace-123' })

      // Assert
      expect(result).toEqual(ok(some(mockWorkspace)))
      expect(mockDeps.workspaceRepository.get).toHaveBeenCalledWith('workspace-123')
    })

    it('should return none when workspace not found', async () => {
      // Arrange
      const mockDeps = createMockDependencies()

      mockDeps.workspaceRepository.get.mockResolvedValue(ok(none))

      const useCase = new GetWorkspaceUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ idExt: 'nonexistent' })

      // Assert
      expect(result).toEqual(ok(none))
      expect(mockDeps.workspaceRepository.get).toHaveBeenCalledWith('nonexistent')
    })
  })
})
