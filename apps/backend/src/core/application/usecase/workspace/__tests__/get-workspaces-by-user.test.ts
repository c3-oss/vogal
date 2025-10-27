// 3rd-party
import { describe, expect, it, vi } from 'vitest'

// c3
import { err, isErr, none, ok, some, val } from '@c3-oss/functional'

// internal
import { createMockLogger } from '~test/helpers/mock-logger.js'

// internal
import { GetWorkspacesByUserUseCase } from '../get-workspaces-by-user.js'

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
  logger: createMockLogger(),
})

describe('GetWorkspacesByUserUseCase', () => {
  describe('execute', () => {
    it('should return workspaces for a specific user', async () => {
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

      mockDeps.userRepository.get.mockResolvedValue(ok(some(mockUser)))
      mockDeps.workspaceRepository.getByUser.mockResolvedValue(ok(some(mockWorkspaces)))

      const useCase = new GetWorkspacesByUserUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ userId: 'user-123' })

      // Assert
      if (isErr(result)) {
        throw result.left
      }
      const workspaces = val(result)
      expect(workspaces).toEqual(mockWorkspaces)
      expect(workspaces).toHaveLength(2)
      expect(mockDeps.userRepository.get).toHaveBeenCalledWith('user-123')
      expect(mockDeps.workspaceRepository.getByUser).toHaveBeenCalledWith('user-123')
    })

    it('should return error when user not found', async () => {
      // Arrange
      const mockDeps = createMockDependencies()

      mockDeps.userRepository.get.mockResolvedValue(ok(none))

      const useCase = new GetWorkspacesByUserUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ userId: 'nonexistent' })

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left.message).toBe('User not found')
      }

      expect(mockDeps.userRepository.get).toHaveBeenCalledWith('nonexistent')
      expect(mockDeps.workspaceRepository.getByUser).not.toHaveBeenCalled()
    })

    it('should return error when user repository fails', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const mockError = new Error('Database connection failed')

      mockDeps.userRepository.get.mockResolvedValue(err(mockError))

      const useCase = new GetWorkspacesByUserUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ userId: 'user-123' })

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left).toBe(mockError)
      }

      expect(mockDeps.userRepository.get).toHaveBeenCalledWith('user-123')
      expect(mockDeps.workspaceRepository.getByUser).not.toHaveBeenCalled()
    })

    it('should return error when workspace repository fails', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const mockError = new Error('Database connection failed')

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
      mockDeps.workspaceRepository.getByUser.mockResolvedValue(err(mockError))

      const useCase = new GetWorkspacesByUserUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ userId: 'user-123' })

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left).toBe(mockError)
      }

      expect(mockDeps.userRepository.get).toHaveBeenCalledWith('user-123')
      expect(mockDeps.workspaceRepository.getByUser).toHaveBeenCalledWith('user-123')
    })

    it('should return empty array when user has no workspaces', async () => {
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
      mockDeps.workspaceRepository.getByUser.mockResolvedValue(ok(some([])))

      const useCase = new GetWorkspacesByUserUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ userId: 'user-123' })

      // Assert
      if (isErr(result)) {
        throw result.left
      }
      expect(val(result)).toEqual([])
      expect(mockDeps.userRepository.get).toHaveBeenCalledWith('user-123')
      expect(mockDeps.workspaceRepository.getByUser).toHaveBeenCalledWith('user-123')
    })
  })
})
