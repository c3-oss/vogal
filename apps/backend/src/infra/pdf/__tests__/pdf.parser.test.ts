// standard
import fs from 'node:fs/promises'

// 3rd-party
import { describe, expect, it, vi } from 'vitest'

// internal
import { parsePDF } from '../pdf.parser.js'

// ---------------------------------------------------------------------------------------------------------------------

vi.mock('node:fs/promises', () => ({
  default: {
    readFile: vi.fn(async () => new Uint8Array([1, 2, 3])),
  },
}))

vi.mock('pdf-parse', () => {
  class PDFParse {
    async getText() {
      return {
        total: 2,
        pages: [
          { num: 1, text: 'Hello' },
          { num: 2, text: 'World' },
        ],
      }
    }
    async getInfo() {
      return { info: { title: 'T', author: 'A' } }
    }
    async destroy() {}
  }
  return { PDFParse }
})

describe('parsePDF', () => {
  it('parses pdf and returns pages, total and metadata', async () => {
    const res = await parsePDF('/tmp/x.pdf')
    expect(fs.readFile).toHaveBeenCalled()
    expect(res.totalPages).toBe(2)
    expect(res.metadata).toEqual({ title: 'T', author: 'A' })
    expect(res.pages).toEqual([
      { pageNumber: 1, text: 'Hello' },
      { pageNumber: 2, text: 'World' },
    ])
  })
})
