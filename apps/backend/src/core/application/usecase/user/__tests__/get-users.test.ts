// 3rd-party
import { describe, expect, it, vi } from 'vitest'

// c3
import { isLeft, ok, val } from '@c3-oss/functional'

// internal
import { createMockLogger } from '~test/helpers/mock-logger.js'

// internal
import { GetUsersUseCase } from '../get-users.js'

// ---------------------------------------------------------------------------------------------------------------------

const createMockDependencies = () => ({
  userRepository: {
    create: vi.fn(),
    get: vi.fn(),
    getByEmail: vi.fn(),
    getAll: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
  logger: createMockLogger(),
})

describe('GetUsersUseCase', () => {
  describe('execute', () => {
    it('should return all users', async () => {
      // Arrange
      const mockDeps = createMockDependencies()

      const mockUsers = [
        {
          id: 1,
          idExt: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
          isDeleted: false,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          idExt: 'user-456',
          name: 'Jane Smith',
          email: 'jane@example.com',
          isDeleted: false,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockDeps.userRepository.getAll.mockResolvedValue(
        ok({
          meta: { totalResults: 2, totalPages: 2, currentPage: 1, hasNextPage: true, hasPreviousPage: false },
          items: mockUsers,
        }),
      )

      const useCase = new GetUsersUseCase(mockDeps)

      // Act
      const result = await useCase.execute()

      // Assert
      if (isLeft(result)) {
        throw result.left
      }

      expect(val(result)).toEqual({
        meta: { totalResults: 2, totalPages: 2, currentPage: 1, hasNextPage: true, hasPreviousPage: false },
        items: mockUsers,
      })
      expect(val(result).items).toHaveLength(2)
      expect(mockDeps.userRepository.getAll).toHaveBeenCalledWith({})
    })

    it('should return empty array when no users exist', async () => {
      // Arrange
      const mockDeps = createMockDependencies()

      mockDeps.userRepository.getAll.mockResolvedValue(
        ok({
          meta: { totalResults: 0, totalPages: 0, currentPage: 1, hasNextPage: false, hasPreviousPage: false },
          items: [],
        }),
      )

      const useCase = new GetUsersUseCase(mockDeps)

      // Act
      const result = await useCase.execute()

      // Assert
      if (isLeft(result)) {
        throw result.left
      }

      expect(val(result)).toEqual({
        meta: { totalResults: 0, totalPages: 0, currentPage: 1, hasNextPage: false, hasPreviousPage: false },
        items: [],
      })
      expect(mockDeps.userRepository.getAll).toHaveBeenCalledWith({})
    })

    it('should forward pagination filters', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const filters = { limit: 5, page: 3, orderField: 'createdAt', orderDirection: 'asc' as const }

      mockDeps.userRepository.getAll.mockResolvedValue(
        ok({
          meta: { totalResults: 0, totalPages: 0, currentPage: 3, hasNextPage: false, hasPreviousPage: true },
          items: [],
        }),
      )

      const useCase = new GetUsersUseCase(mockDeps)

      // Act
      await useCase.execute(filters)

      // Assert
      expect(mockDeps.userRepository.getAll).toHaveBeenCalledWith(filters)
    })
  })
})
