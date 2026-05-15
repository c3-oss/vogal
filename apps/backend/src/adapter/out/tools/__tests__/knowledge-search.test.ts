// 3rd-party
import { beforeEach, describe, expect, it, vi } from 'vitest'

// c3
import { err, ok } from '@c3-oss/functional'

import type { SearchUseCase } from '~application/usecase/document/search.js'
// internal
import { KnowledgeSearchTool } from '../knowledge-search.tool.js'

// ---------------------------------------------------------------------------------------------------------------------

describe('KnowledgeSearchTool', () => {
  let mockSearchUseCase: SearchUseCase
  let tool: KnowledgeSearchTool

  beforeEach(() => {
    mockSearchUseCase = {
      execute: vi.fn().mockResolvedValue(ok([])),
    } as any

    tool = new KnowledgeSearchTool(mockSearchUseCase)
  })

  it('should have correct name', () => {
    expect(tool.name).toBe('search_knowledge')
  })

  describe('execute', () => {
    it('should search successfully with default limit', async () => {
      // Arrange
      const mockSearchResult = {
        query: 'test query',
        totalFound: 1,
        results: [
          {
            id: 1,
            idExt: 'doc-1',
            filename: 'test.pdf',
            content: 'Test content',
            score: 0.9,
          },
        ],
      }

      vi.mocked(mockSearchUseCase.execute).mockResolvedValue(ok(mockSearchResult))

      const params = {
        workspaceIdExt: 'workspace-123',
        query: 'test query',
      }

      // Act
      const result = await tool.execute(params)

      // Assert
      expect(result).toEqual({ right: { results: mockSearchResult } })
      expect(mockSearchUseCase.execute).toHaveBeenCalledWith({
        query: 'test query',
        limit: 5,
        workspaceId: 'workspace-123',
      })
    })

    it('should search successfully with custom limit', async () => {
      // Arrange
      const mockSearchResult = {
        query: 'test query',
        totalFound: 1,
        results: [
          {
            id: 1,
            idExt: 'doc-1',
            filename: 'test.pdf',
            content: 'Test content',
            score: 0.9,
          },
        ],
      }

      vi.mocked(mockSearchUseCase.execute).mockResolvedValue(ok(mockSearchResult))

      const params = {
        workspaceIdExt: 'workspace-123',
        query: 'test query',
        limit: 10,
      }

      // Act
      const result = await tool.execute(params)

      // Assert
      expect(result).toEqual({ right: { results: mockSearchResult } })
      expect(mockSearchUseCase.execute).toHaveBeenCalledWith({
        query: 'test query',
        limit: 10,
        workspaceId: 'workspace-123',
      })
    })

    it('should return error when search fails', async () => {
      // Arrange
      const error = new Error('Search failed')
      vi.mocked(mockSearchUseCase.execute).mockResolvedValue(err(error))

      const params = {
        workspaceIdExt: 'workspace-123',
        query: 'test query',
      }

      // Act
      const result = await tool.execute(params)

      // Assert
      expect(result).toEqual(err(error))
      expect(mockSearchUseCase.execute).toHaveBeenCalledWith({
        query: 'test query',
        limit: 5,
        workspaceId: 'workspace-123',
      })
    })

    it('should handle empty results', async () => {
      // Arrange
      const mockSearchResult = {
        query: 'test query',
        totalFound: 0,
        results: [],
      }
      vi.mocked(mockSearchUseCase.execute).mockResolvedValue(ok(mockSearchResult))

      const params = {
        workspaceIdExt: 'workspace-123',
        query: 'test query',
      }

      // Act
      const result = await tool.execute(params)

      // Assert
      expect(result).toEqual({ right: { results: mockSearchResult } })
      expect(mockSearchUseCase.execute).toHaveBeenCalledWith({
        query: 'test query',
        limit: 5,
        workspaceId: 'workspace-123',
      })
    })
  })
})
