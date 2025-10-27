// 3rd-party
import { describe, expect, it } from 'vitest'

// internal
import { chunkText } from '~infra/text-utils.js'

// ---------------------------------------------------------------------------------------------------------------------

describe('chunkText', () => {
  describe('basic chunking', () => {
    it('should chunk text without overlap', () => {
      // Arrange
      const text = 'Hello World Test String'
      const chunkSize = 5
      const overlap = 0

      // Act
      const result = chunkText(text, chunkSize, overlap)

      // Assert
      expect(result).toEqual(['Hello', ' Worl', 'd Tes', 't Str', 'ing'])
    })

    it('should chunk text with overlap', () => {
      // Arrange
      const text = 'Hello World Test'
      const chunkSize = 5
      const overlap = 2

      // Act
      const result = chunkText(text, chunkSize, overlap)

      // Assert
      expect(result).toEqual(['Hello', 'lo Wo', 'World', 'ld Te', 'Test', 'st'])
    })

    it('should handle zero overlap', () => {
      // Arrange
      const text = 'abcdef'
      const chunkSize = 2
      const overlap = 0

      // Act
      const result = chunkText(text, chunkSize, overlap)

      // Assert
      expect(result).toEqual(['ab', 'cd', 'ef'])
    })
  })

  describe('edge cases', () => {
    it('should handle empty text', () => {
      // Arrange
      const text = ''
      const chunkSize = 5
      const overlap = 2

      // Act
      const result = chunkText(text, chunkSize, overlap)

      // Assert
      expect(result).toEqual([])
    })

    it('should handle text shorter than chunk size', () => {
      // Arrange
      const text = 'Hi'
      const chunkSize = 10
      const overlap = 2

      // Act
      const result = chunkText(text, chunkSize, overlap)

      // Assert
      expect(result).toEqual(['Hi'])
    })

    it('should handle text exactly matching chunk size', () => {
      // Arrange
      const text = 'Hello'
      const chunkSize = 5
      const overlap = 0

      // Act
      const result = chunkText(text, chunkSize, overlap)

      // Assert
      expect(result).toEqual(['Hello'])
    })

    it('should handle single character chunks', () => {
      // Arrange
      const text = 'abc'
      const chunkSize = 1
      const overlap = 0

      // Act
      const result = chunkText(text, chunkSize, overlap)

      // Assert
      expect(result).toEqual(['a', 'b', 'c'])
    })
  })

  describe('overlap handling', () => {
    it('should handle overlap larger than chunk size', () => {
      // Arrange
      const text = 'Hello World'
      const chunkSize = 3
      const overlap = 5

      // Act
      const result = chunkText(text, chunkSize, overlap)

      // Assert
      // When overlap >= chunkSize, overlap is limited to chunkSize - 1 (2)
      expect(result).toEqual(['Hel', 'ell', 'llo', 'lo ', 'o W', ' Wo', 'Wor', 'orl', 'rld', 'ld'])
    })

    it('should handle single character chunks with overlap', () => {
      // Arrange
      const text = 'abc'
      const chunkSize = 1
      const overlap = 1

      // Act
      const result = chunkText(text, chunkSize, overlap)

      // Assert
      // When overlap >= chunkSize, overlap is limited to chunkSize - 1 (0)
      expect(result).toEqual(['a', 'b', 'c'])
    })

    it('should create overlapping chunks', () => {
      // Arrange
      const text = 'Hello World Test'
      const chunkSize = 6
      const overlap = 2

      // Act
      const result = chunkText(text, chunkSize, overlap)

      // Assert
      // Verify that adjacent chunks overlap by the expected amount
      expect(result.length).toBeGreaterThan(1)
      for (let i = 0; i < result.length - 1; i++) {
        const currentChunk = result[i]
        const nextChunk = result[i + 1]
        // The end of current chunk should overlap with start of next chunk
        const overlapText = currentChunk?.slice(-overlap)
        expect(nextChunk?.startsWith(overlapText ?? '')).toBe(true)
      }
    })
  })

  describe('performance', () => {
    it('should handle large text efficiently', () => {
      // Arrange
      const text = 'a'.repeat(1000)
      const chunkSize = 100
      const overlap = 10

      // Act
      const result = chunkText(text, chunkSize, overlap)

      // Assert
      expect(result.length).toBeGreaterThan(1)
      expect(result.at(0)?.length).toBe(100)
      // Verify that chunks overlap correctly
      if (result.length > 1) {
        expect(result.at(0)?.slice(-10)).toBe(result.at(1)?.slice(0, 10))
      }
    })
  })
})
