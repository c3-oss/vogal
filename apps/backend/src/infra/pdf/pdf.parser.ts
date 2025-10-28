// standard
import fs from 'node:fs/promises'

// 3rd-party
import { type InfoResult, PDFParse, type TextResult } from 'pdf-parse'

// internal
import type { DocumentMetadataBasicInfoDTO, DocumentPageBasicInfoDTO } from '~application/dto/index.js'

// ---------------------------------------------------------------------------------------------------------------------

export interface ParsePDFResult {
  pages: DocumentPageBasicInfoDTO[]
  totalPages: number
  metadata: Partial<DocumentMetadataBasicInfoDTO>
}

export async function parsePDF(filePath: string): Promise<ParsePDFResult> {
  const dataBuffer = await fs.readFile(filePath)
  const parser = new PDFParse({ data: dataBuffer })
  const data: TextResult = await parser.getText()
  const info: InfoResult = await parser.getInfo()
  await parser.destroy()

  const { title, author } = info.info ?? {}
  const pages = data.pages.map((p) => ({ pageNumber: p.num, text: p.text }))
  const totalPages = data.total
  const metadata = { title, author }

  return { pages, totalPages, metadata }
}
