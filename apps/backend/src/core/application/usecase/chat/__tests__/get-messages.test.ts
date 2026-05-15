// 3rd-party
import { describe, expect, it, vi } from 'vitest'

// c3
import { err, isErr, ok } from '@c3-oss/functional'

// internal
import { createMockLogger } from '~test/helpers/mock-logger.js'

// internal
import { GetChatMessagesUseCase } from '../get-messages.js'

// ---------------------------------------------------------------------------------------------------------------------

const createMockDependencies = () => ({
  chatRepository: {
    get: vi.fn(),
    create: vi.fn(),
    createMessage: vi.fn(),
    listMessages: vi.fn(),
  },
  logger: createMockLogger(),
})

describe('GetChatMessagesUseCase', () => {
  describe('execute', () => {
    it('should return chat messages successfully', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const mockMessages = [
        { id: 1, chatId: 1, role: 'user', content: 'Hello', createdAt: new Date() },
        { id: 2, chatId: 1, role: 'assistant', content: 'Hi there!', createdAt: new Date() },
      ]

      mockDeps.chatRepository.listMessages.mockResolvedValue(ok(mockMessages))

      const useCase = new GetChatMessagesUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ chatIdExt: 'chat-123' })

      // Assert
      expect(isErr(result)).toBe(false)
      if (!isErr(result)) {
        expect(result.right).toEqual(mockMessages)
      }
      expect(mockDeps.chatRepository.listMessages).toHaveBeenCalledWith('chat-123')
      expect(mockDeps.logger.debug).toHaveBeenCalledWith({ chatIdExt: 'chat-123' }, 'list chat messages requested')
    })

    it('should return error when listMessages fails', async () => {
      // Arrange
      const mockDeps = createMockDependencies()
      const mockError = new Error('Database connection failed')

      mockDeps.chatRepository.listMessages.mockResolvedValue(err(mockError))

      const useCase = new GetChatMessagesUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ chatIdExt: 'chat-123' })

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left).toBe(mockError)
      }
      expect(mockDeps.chatRepository.listMessages).toHaveBeenCalledWith('chat-123')
    })
  })
})
