// 3rd-party
import { describe, expect, it, vi } from 'vitest'

// c3
import { isNone, isSome, none, ok, some } from '@c3-oss/functional'

// internal
import { createMockLogger } from '~test/helpers/mock-logger.js'

// internal
import { DeleteUserUseCase } from '../delete-user.js'

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

describe('DeleteUserUseCase', () => {
  describe('execute', () => {
    it('should delete user successfully', async () => {
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
      mockDeps.userRepository.delete.mockResolvedValue(none)

      const useCase = new DeleteUserUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ idExt: 'user-123' })

      // Assert
      expect(isNone(result)).toBe(true)
      expect(mockDeps.userRepository.get).toHaveBeenCalledWith('user-123')
      expect(mockDeps.userRepository.delete).toHaveBeenCalledWith('user-123')
    })

    it('should return error when user not found', async () => {
      // Arrange
      const mockDeps = createMockDependencies()

      mockDeps.userRepository.get.mockResolvedValue(ok(none))

      const useCase = new DeleteUserUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ idExt: 'nonexistent' })

      // Assert
      expect(isSome(result)).toBe(true)
      if (isSome(result)) {
        expect(result.value.message).toBe('User not found')
      }

      expect(mockDeps.userRepository.get).toHaveBeenCalledWith('nonexistent')
      expect(mockDeps.userRepository.delete).not.toHaveBeenCalled()
    })
  })
})
