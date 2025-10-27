// 3rd-party
import { describe, expect, it } from 'vitest'

// internal
import { normalizeFilename } from '~infra/filename.js'

// ---------------------------------------------------------------------------------------------------------------------

describe('normalizeFilename', () => {
  describe('basic normalization', () => {
    it('should normalize a simple filename', () => {
      const result = normalizeFilename('hello world.txt')
      expect(result).toBe('hello-world.txt')
    })

    it('should preserve alphanumeric characters', () => {
      const result = normalizeFilename('File123.pdf')
      expect(result).toBe('File123.pdf')
    })

    it('should remove diacritics', () => {
      const result = normalizeFilename('Café-Résumé.doc')
      expect(result).toBe('Cafe-Resume.doc')
    })

    it('should convert special characters to hyphens', () => {
      const result = normalizeFilename('hello@world#test.txt')
      expect(result).toBe('hello-world-test.txt')
    })

    it('should collapse multiple hyphens', () => {
      const result = normalizeFilename('hello---world.txt')
      expect(result).toBe('hello-world.txt')
    })

    it('should trim leading and trailing hyphens', () => {
      const result = normalizeFilename('-hello-world-.txt')
      expect(result).toBe('hello-world.txt')
    })
  })

  describe('edge cases', () => {
    it('should return "file" for empty string', () => {
      const result = normalizeFilename('')
      expect(result).toBe('file')
    })

    it('should return "file" for null input', () => {
      // @ts-expect-error Testing runtime behavior
      const result = normalizeFilename(null)
      expect(result).toBe('file')
    })

    it('should return "file" for undefined input', () => {
      // @ts-expect-error Testing runtime behavior
      const result = normalizeFilename(undefined)
      expect(result).toBe('file')
    })

    it('should return "file" for whitespace-only string', () => {
      const result = normalizeFilename('   ')
      expect(result).toBe('file')
    })

    it('should return "file.ext" when base sanitizes to nothing', () => {
      const result = normalizeFilename('###.txt')
      expect(result).toBe('file.txt')
    })

    it('should return "file" when both base and extension sanitize to nothing', () => {
      const result = normalizeFilename('###.###')
      expect(result).toBe('file')
    })

    it('should handle filename without extension', () => {
      const result = normalizeFilename('hello-world')
      expect(result).toBe('hello-world')
    })

    it('should handle filename with dot at the end', () => {
      const result = normalizeFilename('hello-world.')
      expect(result).toBe('hello-world')
    })

    it('should handle filename with dot at the start', () => {
      const result = normalizeFilename('.gitignore')
      expect(result).toBe('gitignore')
    })

    it('should handle multiple dots in filename', () => {
      const result = normalizeFilename('my.file.name.txt')
      expect(result).toBe('my-file-name.txt')
    })
  })

  describe('extension handling', () => {
    it('should lowercase extension', () => {
      const result = normalizeFilename('hello.TXT')
      expect(result).toBe('hello.txt')
    })

    it('should sanitize extension', () => {
      const result = normalizeFilename('hello.t@x#t')
      expect(result).toBe('hello.txt')
    })

    it('should handle empty extension after sanitization', () => {
      const result = normalizeFilename('hello.@@@')
      expect(result).toBe('hello')
    })
  })

  describe('length constraints', () => {
    it('should handle very long filename', () => {
      const longBase = 'a'.repeat(300)
      const result = normalizeFilename(`${longBase}.txt`)
      // Should be truncated to 255 chars total (251 base + dot + 3 ext = 255)
      expect(result.length).toBeLessThanOrEqual(255)
      expect(result.endsWith('.txt')).toBe(true)
    })

    it('should handle very long filename without extension', () => {
      const longBase = 'a'.repeat(300)
      const result = normalizeFilename(longBase)
      expect(result.length).toBeLessThanOrEqual(255)
    })

    it('should maintain at least 1 character for base when truncating', () => {
      const longBase = 'a'.repeat(300)
      const longExt = 'b'.repeat(250)
      const result = normalizeFilename(`${longBase}.${longExt}`)
      // Base should have at least 1 char
      expect(result.split('.')[0]?.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('unicode and special characters', () => {
    it('should handle emoji', () => {
      const result = normalizeFilename('hello-😀-world.txt')
      expect(result).toBe('hello-world.txt')
    })

    it('should handle Chinese characters', () => {
      const result = normalizeFilename('文档.txt')
      expect(result).toBe('file.txt')
    })

    it('should handle mixed unicode', () => {
      const result = normalizeFilename('café-文档-😀.doc')
      expect(result).toBe('cafe.doc')
    })

    it('should handle accented characters', () => {
      const result = normalizeFilename('Hëllö Wörld.txt')
      expect(result).toBe('Hello-World.txt')
    })
  })

  describe('real-world examples', () => {
    it('should handle typical document name', () => {
      const result = normalizeFilename('My Document v2 (final).docx')
      expect(result).toBe('My-Document-v2-final.docx')
    })

    it('should handle URL-like filename', () => {
      const result = normalizeFilename('https://example.com/file.pdf')
      expect(result).toBe('https-example-com-file.pdf')
    })

    it('should handle date-stamped filename', () => {
      const result = normalizeFilename('report-2024-01-15.xlsx')
      expect(result).toBe('report-2024-01-15.xlsx')
    })

    it('should handle filename with parentheses', () => {
      const result = normalizeFilename('Document (copy) [1].txt')
      expect(result).toBe('Document-copy-1.txt')
    })
  })
})
