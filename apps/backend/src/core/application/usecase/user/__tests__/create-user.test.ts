// 3rd-party
import { describe, expect, it, vi } from 'vitest'

// c3
import { err, isErr, none, ok, some, val } from '@c3-oss/functional'

// internal
import { createMockLogger } from '~test/helpers/mock-logger.js'

// internal
import { CreateUserUseCase } from '../create-user.js'

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

describe('CreateUserUseCase', () => {
  describe('execute', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const mockDeps = createMockDependencies()

      mockDeps.userRepository.getByEmail.mockResolvedValue(ok(none))
      mockDeps.userRepository.create.mockResolvedValue(ok('user-123'))

      const useCase = new CreateUserUseCase(mockDeps)

      // Act
      const result = await useCase.execute({
        name: 'John Doe',
        email: 'john@example.com',
      })

      // Assert
      if (isErr(result)) {
        throw result.left
      }
      expect(val(result)).toBe('user-123')
      expect(mockDeps.userRepository.getByEmail).toHaveBeenCalledWith('john@example.com')
      expect(mockDeps.userRepository.create).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
      })
    })

    it('should return error when user with email already exists', async () => {
      // Arrange
      const mockDeps = createMockDependencies()

      mockDeps.userRepository.getByEmail.mockResolvedValue(
        ok(
          some({
            id: 1,
            idExt: 'existing-user',
            name: 'Existing User',
            email: 'john@example.com',
            isDeleted: false,
            deletedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        ),
      )

      const useCase = new CreateUserUseCase(mockDeps)

      // Act
      const result = await useCase.execute({
        name: 'John Doe',
        email: 'john@example.com',
      })

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left.message).toBe('User with this email already exists')
      }

      expect(mockDeps.userRepository.getByEmail).toHaveBeenCalledWith('john@example.com')
      expect(mockDeps.userRepository.create).not.toHaveBeenCalled()
    })

    it('should return error when getByEmail fails', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const mockError = new Error('Database connection failed')

      mockDeps.userRepository.getByEmail.mockResolvedValue(err(mockError))

      const useCase = new CreateUserUseCase(mockDeps)

      // Act
      const result = await useCase.execute({
        name: 'John Doe',
        email: 'john@example.com',
      })

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left).toBe(mockError)
      }

      expect(mockDeps.userRepository.getByEmail).toHaveBeenCalledWith('john@example.com')
      expect(mockDeps.userRepository.create).not.toHaveBeenCalled()
    })
  })
})
