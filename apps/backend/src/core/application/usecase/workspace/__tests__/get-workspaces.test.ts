// 3rd-party
import { describe, expect, it, vi } from 'vitest'

// c3
import { isLeft, ok, val } from '@c3-oss/functional'

// internal
import { createMockLogger } from '~test/helpers/mock-logger.js'

// internal
import { GetWorkspacesUseCase } from '../get-workspaces.js'

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

describe('GetWorkspacesUseCase', () => {
  describe('execute', () => {
    it('should return all workspaces', async () => {
      // Arrange
      const mockDeps = createMockDependencies()

      const mockWorkspaces = [
        {
          id: 1,
          idExt: 'workspace-123',
          name: 'Workspace One',
          userId: 1,
          isDeleted: false,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          idExt: 'workspace-456',
          name: 'Workspace Two',
          userId: 1,
          isDeleted: false,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockDeps.workspaceRepository.getAll.mockResolvedValue(
        ok({
          meta: { totalResults: 2, totalPages: 2, currentPage: 1, hasNextPage: true, hasPreviousPage: false },
          items: mockWorkspaces,
        }),
      )

      const useCase = new GetWorkspacesUseCase(mockDeps)

      // Act
      const result = await useCase.execute()

      // Assert
      if (isLeft(result)) {
        throw result.left
      }

      expect(result).toEqual(
        ok({
          meta: { totalResults: 2, totalPages: 2, currentPage: 1, hasNextPage: true, hasPreviousPage: false },
          items: mockWorkspaces,
        }),
      )
      expect(val(result).items).toHaveLength(2)
      expect(mockDeps.workspaceRepository.getAll).toHaveBeenCalledWith({})
    })

    it('should return empty array when no workspaces exist', async () => {
      // Arrange
      const mockDeps = createMockDependencies()

      mockDeps.workspaceRepository.getAll.mockResolvedValue(
        ok({
          meta: { totalResults: 0, totalPages: 0, currentPage: 1, hasNextPage: false, hasPreviousPage: false },
          items: [],
        }),
      )

      const useCase = new GetWorkspacesUseCase(mockDeps)

      // Act
      const result = await useCase.execute()

      // Assert
      expect(result).toEqual(
        ok({
          meta: { totalResults: 0, totalPages: 0, currentPage: 1, hasNextPage: false, hasPreviousPage: false },
          items: [],
        }),
      )
      expect(mockDeps.workspaceRepository.getAll).toHaveBeenCalledWith({})
    })

    it('should forward pagination filters', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const filters = { limit: 3, page: 4, orderField: 'createdAt', orderDirection: 'asc' as const }

      mockDeps.workspaceRepository.getAll.mockResolvedValue(
        ok({
          meta: { totalResults: 0, totalPages: 0, currentPage: 4, hasNextPage: false, hasPreviousPage: true },
          items: [],
        }),
      )

      const useCase = new GetWorkspacesUseCase(mockDeps)

      // Act
      await useCase.execute(filters)

      // Assert
      expect(mockDeps.workspaceRepository.getAll).toHaveBeenCalledWith(filters)
    })
  })
})
