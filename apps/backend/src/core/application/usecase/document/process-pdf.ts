// 3rd-party
import { v4 as uuid } from 'uuid'

// c3
import { type Option, isErr, isSome, none, some, val } from '@c3-oss/functional'
import type { Logger } from '@c3-oss/logger'

// internal
import type { DocumentMetadataInsertDTO, DocumentPageInsertDTO, IndexedPointDTO } from '~application/dto/index.js'
import type {
  DocumentWritePort,
  EmbedderPort,
  TextNormalizerPort,
  VogalRepositoryPort,
} from '~application/port/index.js'
import { BaseUseCase } from '~application/usecase/base-usecase.js'
import { VErrorProcessingFailed } from '~infra/errors/index.js'

// ---------------------------------------------------------------------------------------------------------------------

export interface ProcessPdfDeps {
  embedder: EmbedderPort
  repository: VogalRepositoryPort
  normalizer: TextNormalizerPort
  writer: DocumentWritePort
  logger: Logger
}

export interface ProcessPdfParams {
  documentId: number
  documentIdExt: string
  workspaceIdExt: string
  filename: string
  contentType: string
  pages: Array<{ pageNumber: number; text: string }>
  totalPages: number
  metadata: { title?: string; author?: string }
  chunkSize: number
  chunkOverlap: number
  chunkText: (text: string, chunkSize: number, overlap: number) => string[]
}

export class ProcessPdfUseCase extends BaseUseCase {
  private readonly embedder: EmbedderPort
  private readonly repository: VogalRepositoryPort
  private readonly normalizer: TextNormalizerPort
  private readonly writer: DocumentWritePort
  private readonly log: Logger

  public constructor(deps: ProcessPdfDeps) {
    super()
    const { embedder, repository, normalizer, writer, logger } = deps
    this.invariant({ embedder, repository, normalizer, writer, logger })

    this.embedder = embedder
    this.repository = repository
    this.normalizer = normalizer
    this.writer = writer
    this.log = logger.child({ usecase: 'ProcessPdfUseCase' })
  }

  public async execute(params: ProcessPdfParams): Promise<Option<Error>> {
    const {
      documentId,
      documentIdExt,
      workspaceIdExt,
      filename,
      pages,
      totalPages,
      metadata,
      chunkSize,
      chunkOverlap,
      chunkText,
    } = params

    this.log.info(
      { documentId, documentIdExt, workspaceIdExt, filename, totalPages, pageCount: pages.length },
      'starting PDF processing',
    )

    const points: IndexedPointDTO[] = []
    let chunkGlobalIndex = 0

    const pageRows: DocumentPageInsertDTO[] = []
    for (const page of pages) {
      const { pageNumber, text } = page

      const normalizedTextResult = await this.normalizer.normalize(text)
      if (isErr(normalizedTextResult)) {
        this.log.warn(
          { documentIdExt, workspaceIdExt, filename, pageNumber, error: normalizedTextResult.left },
          'failed to normalize page text',
        )
        return some(
          new VErrorProcessingFailed({
            message: 'Text normalization failed',
            context: { documentIdExt, workspaceIdExt, filename, pageNumber },
          }),
        )
      }
      const normalizedText = val(normalizedTextResult)

      /* ... */

      pageRows.push({
        documentId,
        pageNumber,
        rawContent: text,
        normalizedContent: normalizedText,
      })
      const chunks = chunkText(normalizedText, chunkSize, chunkOverlap)
      this.log.debug(
        { documentIdExt, workspaceIdExt, filename, pageNumber, chunkCount: chunks.length },
        'page chunked for embeddings',
      )

      /* ... */

      const embeddingsResult = await this.embedder.embedMany(chunks)
      if (isErr(embeddingsResult)) {
        this.log.warn(
          { documentIdExt, workspaceIdExt, filename, pageNumber, error: embeddingsResult.left },
          'failed to generate embeddings',
        )
        return some(
          new VErrorProcessingFailed({
            message: 'Embedding generation failed',
            context: { documentIdExt, workspaceIdExt, filename, pageNumber, chunkCount: chunks.length },
          }),
        )
      }
      const embeddings = val(embeddingsResult)

      /* ... */

      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex]
        const vector = embeddings[chunkIndex]
        if (chunk === undefined || vector === undefined) {
          continue
        }

        points.push({
          id: uuid(),
          vector,
          payload: {
            documentId: documentIdExt,
            filename,
            chunkIndex,
            pageNumber,
            chunkGlobalIndex: chunkGlobalIndex++,
            text: chunk,
            totalPages,
            ...metadata,
          },
        })
      }
    }

    const insertPagesError = await this.writer.insertPages(pageRows)
    if (isSome(insertPagesError)) {
      this.log.warn(
        { documentIdExt, workspaceIdExt, filename, error: insertPagesError.value },
        'failed to persist document pages',
      )
      return some(insertPagesError.value)
    }

    const metaRows: DocumentMetadataInsertDTO[] = []
    if (metadata.title) {
      metaRows.push({ documentId, key: 'title', value: metadata.title })
    }
    if (metadata.author) {
      metaRows.push({ documentId, key: 'author', value: metadata.author })
    }

    const upsertMetadataError = await this.writer.upsertMetadata(metaRows)
    if (isSome(upsertMetadataError)) {
      this.log.warn(
        { documentIdExt, workspaceIdExt, filename, error: upsertMetadataError.value },
        'failed to upsert document metadata',
      )
      return some(upsertMetadataError.value)
    }

    const upsertPointsError = await this.repository.upsert(points, workspaceIdExt)
    if (isSome(upsertPointsError)) {
      this.log.warn(
        { documentIdExt, workspaceIdExt, filename, error: upsertPointsError.value },
        'failed to upsert vector points',
      )
      return some(upsertPointsError.value)
    }

    this.log.info(
      { documentIdExt, workspaceIdExt, filename, totalPages, chunkTotal: points.length },
      'PDF processing completed',
    )
    return none
  }
}
