// c3
import type { Option } from '@c3-oss/functional'

// internal
import type { DocumentWriteAdapter } from '~out/db/model/document/document-write.adapter.js'
import type { VogalRepositoryPort } from '~port/vogal-repository.port.js'
import type { DocumentUploadDTO } from './types.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Normalizes different failure shapes (Error, string, unknown) into a message
 * that can be safely persisted on the document/upload records.
 */
export const extractErrorMessage = (cause: unknown): string => {
  if (cause instanceof Error) {
    return cause.message
  }
  if (typeof cause === 'string') {
    return cause
  }
  return 'Unknown ingestion failure'
}

/**
 * Best-effort cleanup used when content ingestion failed after persisting data.
 * Each adapter returns an Option<Error> so upstream code can choose how noisy to be.
 */
export const cleanupPersistedContent = async (
  state: DocumentUploadDTO,
  writer: DocumentWriteAdapter,
  vectorRepository: VogalRepositoryPort,
): Promise<Option<Error>[]> => [
  await writer.deleteMetadata(state.documentId),
  await writer.deletePages(state.documentId),
  await vectorRepository.deleteDocumentVectors(state.documentIdExt, state.workspaceIdExt),
]
