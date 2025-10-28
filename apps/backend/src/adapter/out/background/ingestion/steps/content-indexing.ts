// c3
import { type Failable, err, isSome, ok } from '@c3-oss/functional'

// internal
import { cleanupPersistedContent } from '../errors.js'
import type { DocumentUploadDTO } from '../types.js'
import type { SagaDependencies } from '../types.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Parses the PDF, delegates to the domain use case to generate embeddings,
 * and advances the upload state. On failure we roll back all persisted content.
 */
export const performContentIndexing = async (
  state: DocumentUploadDTO,
  deps: Pick<
    SagaDependencies,
    | 'processor'
    | 'uploads'
    | 'logger'
    | 'writer'
    | 'vectorRepository'
    | 'parsePdf'
    | 'chunkText'
    | 'chunkSize'
    | 'chunkOverlap'
  >,
): Promise<Failable<DocumentUploadDTO>> => {
  deps.logger.info({ jobId: state.jobIdExt, documentIdExt: state.documentIdExt }, 'step: parsing and indexing content')

  const parsedDocument = await deps.parsePdf(state.tempFilePath)

  const processingResult = await deps.processor.execute({
    documentId: state.documentId,
    documentIdExt: state.documentIdExt,
    workspaceIdExt: state.workspaceIdExt,
    filename: state.filename,
    contentType: state.contentType,
    pages: parsedDocument.pages,
    totalPages: parsedDocument.totalPages,
    metadata: parsedDocument.metadata,
    chunkSize: deps.chunkSize,
    chunkOverlap: deps.chunkOverlap,
    chunkText: deps.chunkText,
  })

  if (isSome(processingResult)) {
    const results = await cleanupPersistedContent(state, deps.writer, deps.vectorRepository)
    for (const r of results) {
      if (isSome(r)) {
        deps.logger.warn(
          { jobId: state.jobIdExt, documentIdExt: state.documentIdExt, error: r.value },
          'compensation: content cleanup encountered error',
        )
      }
    }
    return err(processingResult.value)
  }

  const updateResult = await deps.uploads.updateById(state.id, {
    lastCompletedStep: 'content_indexed',
    currentStep: 'finalized',
    heartbeatAt: new Date(),
  })

  if (isSome(updateResult)) {
    const results = await cleanupPersistedContent(state, deps.writer, deps.vectorRepository)
    for (const r of results) {
      if (isSome(r)) {
        deps.logger.warn(
          { jobId: state.jobIdExt, documentIdExt: state.documentIdExt, error: r.value },
          'compensation: content cleanup encountered error',
        )
      }
    }
    return err(updateResult.value)
  }

  return ok({
    ...state,
    lastCompletedStep: 'content_indexed',
    currentStep: 'finalized',
  })
}
