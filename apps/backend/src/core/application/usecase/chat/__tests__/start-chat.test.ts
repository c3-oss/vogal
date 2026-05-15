// 3rd-party
import { describe, expect, it, vi } from 'vitest'

// c3
import { err, isErr, none, ok, some, val } from '@c3-oss/functional'

// internal
import { createMockLogger } from '~test/helpers/mock-logger.js'

// internal
import { StartChatUseCase } from '../start-chat.js'

// ---------------------------------------------------------------------------------------------------------------------

const createMockDependencies = () => ({
  chatRepository: {
    get: vi.fn(),
    create: vi.fn(),
    createMessage: vi.fn(),
    listMessages: vi.fn(),
  },
  workspaceRepository: {
    get: vi.fn(),
    create: vi.fn(),
    getAll: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    getByUser: vi.fn(),
  },
  logger: createMockLogger(),
})

describe('StartChatUseCase', () => {
  describe('execute', () => {
    it('should create a new chat successfully', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const mockWorkspace = {
        id: 1,
        idExt: 'workspace-123',
        name: 'Test Workspace',
        userId: 1,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDeps.workspaceRepository.get.mockResolvedValue(ok(some(mockWorkspace)))
      mockDeps.chatRepository.create.mockResolvedValue(ok({ idExt: 'chat-123' }))

      const useCase = new StartChatUseCase(mockDeps)

      // Act
      const result = await useCase.execute({
        workspaceIdExt: 'workspace-123',
        title: 'Test Chat',
      })

      // Assert
      expect(isErr(result)).toBe(false)
      if (!isErr(result)) {
        expect(val(result)).toEqual({ idExt: 'chat-123' })
      }
      expect(mockDeps.workspaceRepository.get).toHaveBeenCalledWith('workspace-123')
      expect(mockDeps.chatRepository.create).toHaveBeenCalledWith({
        workspaceId: 1,
        title: 'Test Chat',
      })
      expect(mockDeps.logger.debug).toHaveBeenCalledWith(
        { workspaceIdExt: 'workspace-123', title: 'Test Chat' },
        'start chat requested',
      )
    })

    it('should create chat without title', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const mockWorkspace = {
        id: 1,
        idExt: 'workspace-123',
        name: 'Test Workspace',
        userId: 1,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDeps.workspaceRepository.get.mockResolvedValue(ok(some(mockWorkspace)))
      mockDeps.chatRepository.create.mockResolvedValue(ok({ idExt: 'chat-456' }))

      const useCase = new StartChatUseCase(mockDeps)

      // Act
      const result = await useCase.execute({
        workspaceIdExt: 'workspace-123',
      })

      // Assert
      expect(isErr(result)).toBe(false)
      if (!isErr(result)) {
        expect(val(result)).toEqual({ idExt: 'chat-456' })
      }
      expect(mockDeps.chatRepository.create).toHaveBeenCalledWith({
        workspaceId: 1,
        title: undefined,
      })
    })

    it('should return empty idExt when workspace not found', async () => {
      // Arrange
      const mockDeps = createMockDependencies()

      mockDeps.workspaceRepository.get.mockResolvedValue(ok(none))

      const useCase = new StartChatUseCase(mockDeps)

      // Act
      const result = await useCase.execute({
        workspaceIdExt: 'nonexistent-workspace',
        title: 'Test Chat',
      })

      // Assert
      expect(isErr(result)).toBe(false)
      if (!isErr(result)) {
        expect(val(result)).toEqual({ idExt: '' })
      }
      expect(mockDeps.workspaceRepository.get).toHaveBeenCalledWith('nonexistent-workspace')
      expect(mockDeps.chatRepository.create).not.toHaveBeenCalled()
    })

    it('should return error when workspaceRepository.get fails', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const mockError = new Error('Database connection failed')

      mockDeps.workspaceRepository.get.mockResolvedValue(err(mockError))

      const useCase = new StartChatUseCase(mockDeps)

      // Act
      const result = await useCase.execute({
        workspaceIdExt: 'workspace-123',
        title: 'Test Chat',
      })

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left).toBe(mockError)
      }
      expect(mockDeps.workspaceRepository.get).toHaveBeenCalledWith('workspace-123')
      expect(mockDeps.chatRepository.create).not.toHaveBeenCalled()
    })

    it('should return error when chatRepository.create fails', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const mockWorkspace = {
        id: 1,
        idExt: 'workspace-123',
        name: 'Test Workspace',
        userId: 1,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const mockError = new Error('Failed to create chat')

      mockDeps.workspaceRepository.get.mockResolvedValue(ok(some(mockWorkspace)))
      mockDeps.chatRepository.create.mockResolvedValue(err(mockError))

      const useCase = new StartChatUseCase(mockDeps)

      // Act
      const result = await useCase.execute({
        workspaceIdExt: 'workspace-123',
        title: 'Test Chat',
      })

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left).toBe(mockError)
      }
      expect(mockDeps.workspaceRepository.get).toHaveBeenCalledWith('workspace-123')
      expect(mockDeps.chatRepository.create).toHaveBeenCalledWith({
        workspaceId: 1,
        title: 'Test Chat',
      })
    })
  })
})
