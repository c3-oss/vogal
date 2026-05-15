// 3rd-party
import { describe, expect, it, vi } from 'vitest'

// c3
import { err, isErr, none, ok, some, val } from '@c3-oss/functional'

// internal
import { createMockLogger } from '~test/helpers/mock-logger.js'

// internal
import { SendMessageUseCase } from '../send-message.js'

// ---------------------------------------------------------------------------------------------------------------------

const createMockDependencies = () => ({
  chatRepository: {
    get: vi.fn(),
    create: vi.fn(),
    createMessage: vi.fn(),
    listMessages: vi.fn(),
  },
  chatLLM: {
    complete: vi.fn(),
  },
  planner: {
    plan: vi.fn(),
  },
  knowledgeTool: {
    name: 'knowledge',
    execute: vi.fn(),
  },
  logger: createMockLogger(),
})

describe('SendMessageUseCase', () => {
  describe('execute', () => {
    it('should send message successfully without tool call', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const mockChat = {
        id: 1,
        workspaceId: 1,
        idExt: 'chat-123',
        title: 'Test Chat',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const mockHistory: Array<{ id: number; chatId: number; role: string; content: string; createdAt: Date }> = [
        { id: 1, chatId: 1, role: 'user', content: 'Previous message', createdAt: new Date() },
      ]
      const mockPlan = ok({ tool: null })
      const mockCompletion = ok({ content: 'Hello! How can I help you?' })

      mockDeps.chatRepository.get.mockResolvedValue(ok(some(mockChat)))
      mockDeps.chatRepository.createMessage.mockResolvedValue(ok({ id: 2 }))
      mockDeps.chatRepository.listMessages.mockResolvedValue(ok(mockHistory))
      mockDeps.planner.plan.mockResolvedValue(mockPlan)
      mockDeps.chatLLM.complete.mockResolvedValue(mockCompletion)

      const useCase = new SendMessageUseCase(mockDeps)

      // Act
      const result = await useCase.execute({
        chatIdExt: 'chat-123',
        content: 'Hello',
      })

      // Assert
      expect(isErr(result)).toBe(false)
      if (!isErr(result)) {
        expect(val(result)).toEqual({ content: 'Hello! How can I help you?' })
      }
      expect(mockDeps.chatRepository.get).toHaveBeenCalledWith('chat-123')
      expect(mockDeps.chatRepository.createMessage).toHaveBeenCalledWith({
        chatId: 1,
        role: 'user',
        content: 'Hello',
      })
      expect(mockDeps.chatRepository.listMessages).toHaveBeenCalledWith('chat-123')
      expect(mockDeps.planner.plan).toHaveBeenCalled()
      expect(mockDeps.chatLLM.complete).toHaveBeenCalledWith({
        workspaceIdExt: '1',
        messages: [
          { role: 'user', content: 'Previous message' },
          { role: 'user', content: 'Hello' },
        ],
        contextChunks: [],
      })
      expect(mockDeps.chatRepository.createMessage).toHaveBeenCalledWith({
        chatId: 1,
        role: 'assistant',
        content: 'Hello! How can I help you?',
      })
    })

    it('should send message successfully with knowledge tool call', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const mockChat = {
        id: 1,
        workspaceId: 1,
        idExt: 'chat-123',
        title: 'Test Chat',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const mockHistory: Array<{ id: number; chatId: number; role: string; content: string; createdAt: Date }> = []
      const mockPlan = ok({
        tool: {
          name: 'search_knowledge',
          args: { query: 'test query', limit: 3 },
        },
      })
      const mockSearch = ok({
        results: {
          query: 'test query',
          results: [
            {
              score: 0.9,
              documentId: 'doc-1',
              filename: 'test.pdf',
              chunkIndex: 1,
            },
          ],
        },
      })
      const mockCompletion = ok({ content: 'Based on the documents...' })

      mockDeps.chatRepository.get.mockResolvedValue(ok(some(mockChat)))
      mockDeps.chatRepository.createMessage.mockResolvedValue(ok({ id: 2 }))
      mockDeps.chatRepository.listMessages.mockResolvedValue(ok(mockHistory))
      mockDeps.planner.plan.mockResolvedValue(mockPlan)
      mockDeps.knowledgeTool.execute.mockResolvedValue(mockSearch)
      mockDeps.chatLLM.complete.mockResolvedValue(mockCompletion)

      const useCase = new SendMessageUseCase(mockDeps)

      // Act
      const result = await useCase.execute({
        chatIdExt: 'chat-123',
        content: 'Tell me about test',
      })

      // Assert
      expect(isErr(result)).toBe(false)
      if (!isErr(result)) {
        expect(val(result)).toEqual({ content: 'Based on the documents...' })
      }
      expect(mockDeps.knowledgeTool.execute).toHaveBeenCalledWith({
        workspaceIdExt: '1',
        query: 'test query',
        limit: 3,
      })
      expect(mockDeps.chatRepository.createMessage).toHaveBeenCalledWith({
        chatId: 1,
        role: 'tool',
        content: expect.stringContaining('test query'),
      })
    })

    it('should return error when chat not found', async () => {
      // Arrange
      const mockDeps = createMockDependencies()

      mockDeps.chatRepository.get.mockResolvedValue(ok(none))

      const useCase = new SendMessageUseCase(mockDeps)

      // Act
      const result = await useCase.execute({
        chatIdExt: 'nonexistent-chat',
        content: 'Hello',
      })

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left.message).toBe('Chat not found')
      }
      expect(mockDeps.chatRepository.get).toHaveBeenCalledWith('nonexistent-chat')
      expect(mockDeps.chatRepository.createMessage).not.toHaveBeenCalled()
    })

    it('should return error when chatRepository.get fails', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const mockError = new Error('Database connection failed')

      mockDeps.chatRepository.get.mockResolvedValue(err(mockError))

      const useCase = new SendMessageUseCase(mockDeps)

      // Act
      const result = await useCase.execute({
        chatIdExt: 'chat-123',
        content: 'Hello',
      })

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left).toBe(mockError)
      }
      expect(mockDeps.chatRepository.get).toHaveBeenCalledWith('chat-123')
      expect(mockDeps.chatRepository.createMessage).not.toHaveBeenCalled()
    })

    it('should return error when createMessage fails', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const mockChat = {
        id: 1,
        workspaceId: 1,
        idExt: 'chat-123',
        title: 'Test Chat',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const mockError = new Error('Failed to create message')

      mockDeps.chatRepository.get.mockResolvedValue(ok(some(mockChat)))
      mockDeps.chatRepository.createMessage.mockResolvedValue(err(mockError))

      const useCase = new SendMessageUseCase(mockDeps)

      // Act
      const result = await useCase.execute({
        chatIdExt: 'chat-123',
        content: 'Hello',
      })

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left).toBe(mockError)
      }
      expect(mockDeps.chatRepository.createMessage).toHaveBeenCalledWith({
        chatId: 1,
        role: 'user',
        content: 'Hello',
      })
    })

    it('should return error when listMessages fails', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const mockChat = {
        id: 1,
        workspaceId: 1,
        idExt: 'chat-123',
        title: 'Test Chat',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const mockError = new Error('Failed to list messages')

      mockDeps.chatRepository.get.mockResolvedValue(ok(some(mockChat)))
      mockDeps.chatRepository.createMessage.mockResolvedValue(ok({ id: 2 }))
      mockDeps.chatRepository.listMessages.mockResolvedValue(err(mockError))

      const useCase = new SendMessageUseCase(mockDeps)

      // Act
      const result = await useCase.execute({
        chatIdExt: 'chat-123',
        content: 'Hello',
      })

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left).toBe(mockError)
      }
      expect(mockDeps.chatRepository.listMessages).toHaveBeenCalledWith('chat-123')
    })

    it('should return error when planner.plan fails', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const mockChat = {
        id: 1,
        workspaceId: 1,
        idExt: 'chat-123',
        title: 'Test Chat',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const mockHistory: Array<{ id: number; chatId: number; role: string; content: string; createdAt: Date }> = []
      const mockError = new Error('Planning failed')

      mockDeps.chatRepository.get.mockResolvedValue(ok(some(mockChat)))
      mockDeps.chatRepository.createMessage.mockResolvedValue(ok({ id: 2 }))
      mockDeps.chatRepository.listMessages.mockResolvedValue(ok(mockHistory))
      mockDeps.planner.plan.mockResolvedValue(err(mockError))

      const useCase = new SendMessageUseCase(mockDeps)

      // Act
      const result = await useCase.execute({
        chatIdExt: 'chat-123',
        content: 'Hello',
      })

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left).toBe(mockError)
      }
      expect(mockDeps.planner.plan).toHaveBeenCalled()
    })

    it('should return error when knowledgeTool.execute fails', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const mockChat = {
        id: 1,
        workspaceId: 1,
        idExt: 'chat-123',
        title: 'Test Chat',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const mockHistory: Array<{ id: number; chatId: number; role: string; content: string; createdAt: Date }> = []
      const mockPlan = ok({
        tool: {
          name: 'search_knowledge',
          args: { query: 'test query', limit: 3 },
        },
      })
      const mockError = new Error('Search failed')

      mockDeps.chatRepository.get.mockResolvedValue(ok(some(mockChat)))
      mockDeps.chatRepository.createMessage.mockResolvedValue(ok({ id: 2 }))
      mockDeps.chatRepository.listMessages.mockResolvedValue(ok(mockHistory))
      mockDeps.planner.plan.mockResolvedValue(mockPlan)
      mockDeps.knowledgeTool.execute.mockResolvedValue(err(mockError))

      const useCase = new SendMessageUseCase(mockDeps)

      // Act
      const result = await useCase.execute({
        chatIdExt: 'chat-123',
        content: 'Tell me about test',
      })

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left).toBe(mockError)
      }
      expect(mockDeps.knowledgeTool.execute).toHaveBeenCalledWith({
        workspaceIdExt: '1',
        query: 'test query',
        limit: 3,
      })
    })

    it('should return error when chatLLM.complete fails', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const mockChat = {
        id: 1,
        workspaceId: 1,
        idExt: 'chat-123',
        title: 'Test Chat',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const mockHistory: Array<{ id: number; chatId: number; role: string; content: string; createdAt: Date }> = []
      const mockPlan = ok({ tool: null })
      const mockError = new Error('LLM completion failed')

      mockDeps.chatRepository.get.mockResolvedValue(ok(some(mockChat)))
      mockDeps.chatRepository.createMessage.mockResolvedValue(ok({ id: 2 }))
      mockDeps.chatRepository.listMessages.mockResolvedValue(ok(mockHistory))
      mockDeps.planner.plan.mockResolvedValue(mockPlan)
      mockDeps.chatLLM.complete.mockResolvedValue(err(mockError))

      const useCase = new SendMessageUseCase(mockDeps)

      // Act
      const result = await useCase.execute({
        chatIdExt: 'chat-123',
        content: 'Hello',
      })

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left).toBe(mockError)
      }
      expect(mockDeps.chatLLM.complete).toHaveBeenCalledWith({
        workspaceIdExt: '1',
        messages: [{ role: 'user', content: 'Hello' }],
        contextChunks: [],
      })
    })
  })
})
