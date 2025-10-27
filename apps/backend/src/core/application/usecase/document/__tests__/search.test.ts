// 3rd-party
import { describe, expect, it, vi } from 'vitest'

// c3
import { isErr, ok, val } from '@c3-oss/functional'

// internal
import { createMockLogger } from '~test/helpers/mock-logger.js'

// internal
import { SearchUseCase } from '../search.js'

// ---------------------------------------------------------------------------------------------------------------------

const createMockDependencies = () => ({
  embedder: {
    embedMany: vi.fn(),
  },
  repository: {
    initCollection: vi.fn(),
    deleteCollection: vi.fn(),
    upsert: vi.fn(),
    deleteDocumentVectors: vi.fn(),
    search: vi.fn(),
    listDocuments: vi.fn(),
  },
  logger: createMockLogger(),
})

describe('SearchUseCase', () => {
  describe('execute', () => {
    it('should search and return formatted results', async () => {
      // Arrange
      const query = 'test search query'
      const mockDeps = createMockDependencies()

      mockDeps.embedder.embedMany.mockResolvedValue(ok([[0.1, 0.2, 0.3, 0.4, 0.5]]))

      const mockSearchResults = [
        {
          score: 0.95,
          payload: {
            documentId: 'doc-123',
            filename: 'test-document.pdf',
            pageNumber: 1,
            chunkIndex: 0,
            chunkGlobalIndex: 0,
            text: 'This is a test chunk of text.',
            totalPages: 10,
            title: 'Test Document',
            author: 'Test Author',
          },
        },
        {
          score: 0.89,
          payload: {
            documentId: 'doc-456',
            filename: 'another-document.pdf',
            pageNumber: 2,
            chunkIndex: 1,
            chunkGlobalIndex: 5,
            text: 'Another chunk with relevant content.',
            totalPages: 5,
            title: 'Another Document',
            author: 'Another Author',
          },
        },
      ]

      mockDeps.repository.search.mockResolvedValue(ok(mockSearchResults))
      const useCase = new SearchUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ query, limit: 5, workspaceId: 'ws-1' })

      // Assert
      if (isErr(result)) {
        throw result.left
      }
      const searchResult = val(result)
      expect(searchResult.query).toBe(query)
      expect(searchResult.totalFound).toBe(2)
      expect(searchResult.results).toHaveLength(2)

      const firstResult = searchResult.results.at(0)
      if (!firstResult) {
        throw new Error('First result not found')
      }
      if (!firstResult.metadata) {
        throw new Error('First result metadata not found')
      }

      expect(firstResult.score).toBe(0.95)
      expect(firstResult.documentId).toBe('doc-123')
      expect(firstResult.filename).toBe('test-document.pdf')
      expect(firstResult.pageNumber).toBe(1)
      expect(firstResult.text).toBe('This is a test chunk of text.')
      expect(firstResult.metadata.title).toBe('Test Document')
      expect(firstResult.metadata.author).toBe('Test Author')
      expect(firstResult.metadata.totalPages).toBe(10)

      expect(mockDeps.embedder.embedMany).toHaveBeenCalledWith([query])
      expect(mockDeps.repository.search).toHaveBeenCalledWith([0.1, 0.2, 0.3, 0.4, 0.5], 5, undefined, 'ws-1')
    })

    it('should apply document filter when provided', async () => {
      // Arrange
      const query = 'filtered search'
      const documentId = 'specific-doc-123'
      const mockDeps = createMockDependencies()

      mockDeps.embedder.embedMany.mockResolvedValue(ok([[0.5, 0.6, 0.7]]))
      mockDeps.repository.search.mockResolvedValue(ok([]))

      const useCase = new SearchUseCase(mockDeps)

      // Act
      await useCase.execute({ query, limit: 3, documentId, workspaceId: 'ws-1' })

      // Assert
      expect(mockDeps.repository.search).toHaveBeenCalledWith([0.5, 0.6, 0.7], 3, { documentId }, 'ws-1')
    })

    it('should return error when embedding fails', async () => {
      // Arrange
      const query = 'failing query'
      const mockDeps = createMockDependencies()

      mockDeps.embedder.embedMany.mockResolvedValue(ok([]))
      const useCase = new SearchUseCase(mockDeps)

      // Act
      const result = await useCase.execute({ query, workspaceId: 'ws-1' })

      // Assert
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.left.message).toBe('Could not generate embedding')
      }
    })

    it('should use default limit when not specified', async () => {
      // Arrange
      const query = 'default limit query'
      const mockDeps = createMockDependencies()

      mockDeps.embedder.embedMany.mockResolvedValue(ok([[0.1, 0.2, 0.3]]))
      mockDeps.repository.search.mockResolvedValue(ok([]))

      const useCase = new SearchUseCase(mockDeps)

      // Act
      await useCase.execute({ query, workspaceId: 'ws-1' })

      // Assert
      expect(mockDeps.repository.search).toHaveBeenCalledWith([0.1, 0.2, 0.3], 5, undefined, 'ws-1')
    })
  })
})
