// 3rd-party
import { describe, expect, it, vi } from 'vitest'

// c3
import { none, ok, some } from '@c3-oss/functional'

// internal
import { createMockLogger } from '~test/helpers/mock-logger.js'

// internal
import { GetUserUseCase } from '../get-user.js'

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

describe('GetUserUseCase', () => {
  describe('execute', () => {
    it('should return user when found', async () => {
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

      const useCase = new GetUserUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ idExt: 'user-123' })

      // Assert
      expect(result).toEqual(ok(some(mockUser)))
      expect(mockDeps.userRepository.get).toHaveBeenCalledWith('user-123')
    })

    it('should return none when user not found', async () => {
      // Arrange
      const mockDeps = createMockDependencies()

      mockDeps.userRepository.get.mockResolvedValue(ok(none))

      const useCase = new GetUserUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ idExt: 'nonexistent' })

      // Assert
      expect(result).toEqual(ok(none))
      expect(mockDeps.userRepository.get).toHaveBeenCalledWith('nonexistent')
    })

    it('should return error when repository fails', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const mockError = new Error('Database connection failed')

      mockDeps.userRepository.get.mockResolvedValue(ok(mockError))

      const useCase = new GetUserUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ idExt: 'user-123' })

      // Assert
      expect(result).toEqual(ok(mockError))
      expect(mockDeps.userRepository.get).toHaveBeenCalledWith('user-123')
    })
  })
})
