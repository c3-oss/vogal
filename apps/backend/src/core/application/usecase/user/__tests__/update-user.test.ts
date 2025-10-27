// 3rd-party
import { describe, expect, it, vi } from 'vitest'

// c3
import { err, isErr, none, ok, some, val } from '@c3-oss/functional'

// internal
import { createMockLogger } from '~test/helpers/mock-logger.js'
import { UpdateUserUseCase } from '../update-user.js'

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

describe('UpdateUserUseCase', () => {
  describe('execute', () => {
    it('should update user data when valid changes are provided', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const existingUser = {
        id: 1,
        idExt: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const updatedUser = { ...existingUser, name: 'Jane Doe', email: 'jane@example.com' }

      mockDeps.userRepository.get.mockResolvedValue(ok(some(existingUser)) as any)
      mockDeps.userRepository.getByEmail.mockResolvedValue(ok(none) as any)
      mockDeps.userRepository.update.mockResolvedValue(ok(some(updatedUser)) as any)

      const useCase = new UpdateUserUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ idExt: 'user-1', name: 'Jane Doe', email: 'jane@example.com' })

      // Assert
      expect(isErr(result)).toBe(false)
      if (isErr(result)) {
        throw result.left
      }
      expect(val(result)).toEqual(updatedUser)
      expect(mockDeps.userRepository.update).toHaveBeenCalledWith('user-1', {
        name: 'Jane Doe',
        email: 'jane@example.com',
      })
    })

    it('should return error when no fields are provided', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const useCase = new UpdateUserUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ idExt: 'user-1' } as any)

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left.message).toBe('No fields provided for update')
      }
      expect(mockDeps.userRepository.get).not.toHaveBeenCalled()
    })

    it('should return not found when user does not exist', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      mockDeps.userRepository.get.mockResolvedValue(ok(none) as any)

      const useCase = new UpdateUserUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ idExt: 'user-1', name: 'John Doe' })

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left.message).toBe('User not found')
      }
      expect(mockDeps.userRepository.update).not.toHaveBeenCalled()
    })

    it('should skip update when data is unchanged', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const existingUser = {
        id: 1,
        idExt: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDeps.userRepository.get.mockResolvedValue(ok(some(existingUser)) as any)

      const useCase = new UpdateUserUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ idExt: 'user-1', name: 'John Doe', email: 'john@example.com' })

      // Assert
      expect(isErr(result)).toBe(false)
      if (isErr(result)) {
        throw result.left
      }
      expect(val(result)).toEqual(existingUser)
      expect(mockDeps.userRepository.getByEmail).not.toHaveBeenCalled()
      expect(mockDeps.userRepository.update).not.toHaveBeenCalled()
    })

    it('should return error when email is already in use', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const existingUser = {
        id: 1,
        idExt: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const conflictingUser = { ...existingUser, idExt: 'user-2', email: 'jane@example.com' }

      mockDeps.userRepository.get.mockResolvedValue(ok(some(existingUser)) as any)
      mockDeps.userRepository.getByEmail.mockResolvedValue(ok(some(conflictingUser)) as any)

      const useCase = new UpdateUserUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ idExt: 'user-1', email: 'jane@example.com' })

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left.message).toBe('User with this email already exists')
      }
      expect(mockDeps.userRepository.update).not.toHaveBeenCalled()
    })

    it('should propagate repository update errors', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const existingUser = {
        id: 1,
        idExt: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDeps.userRepository.get.mockResolvedValue(ok(some(existingUser)) as any)
      mockDeps.userRepository.getByEmail.mockResolvedValue(ok(none) as any)
      mockDeps.userRepository.update.mockResolvedValue(err(new Error('db error')) as any)

      const useCase = new UpdateUserUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ idExt: 'user-1', name: 'Jane Doe' })

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left.message).toBe('db error')
      }
    })
  })
})
