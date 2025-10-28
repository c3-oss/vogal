// c3
import { isSome } from '@c3-oss/functional'
import type { Logger } from '@c3-oss/logger'
import type { Optional } from '@c3-oss/types'

// internal
import { cleanupPersistedContent } from './errors.js'
import { getStepIndex } from './progression.js'
import { safeRemoveRemoteFile } from './storage.js'
import type { DocumentUploadDTO } from './types.js'
import type { SagaDependencies } from './types.js'

// ---------------------------------------------------------------------------------------------------------------------

type CompensationDeps = Pick<SagaDependencies, 'logger' | 'writer' | 'uploads' | 'storage' | 'vectorRepository'>

/**
 * Runs step-aware compensations after a failure.
 * Each block is guarded by the last completed step so we only undo what actually ran.
 */
export const runCompensations = async (state: DocumentUploadDTO, deps: CompensationDeps): Promise<void> => {
  const lastStep = state.lastCompletedStep ?? 'pending'

  if (getStepIndex(lastStep) >= getStepIndex('content_indexed')) {
    const results = await cleanupPersistedContent(state, deps.writer, deps.vectorRepository)
    logCompensationWarnings(
      deps.logger,
      { jobIdExt: state.jobIdExt, documentIdExt: state.documentIdExt },
      results.map((result) => (isSome(result) ? result.value : undefined)),
    )
  }

  if (getStepIndex(lastStep) >= getStepIndex('file_reference')) {
    const res = await deps.writer.deleteFileReference(state.documentId)
    logCompensationWarnings(deps.logger, { jobIdExt: state.jobIdExt, documentIdExt: state.documentIdExt }, [
      isSome(res) ? res.value : undefined,
    ])
  }

  if (getStepIndex(lastStep) >= getStepIndex('storage_upload')) {
    await safeRemoveRemoteFile(
      deps.storage,
      deps.logger,
      state.storageBucket ?? undefined,
      state.storageObjectKey ?? undefined,
    )
  }
}

/**
 * Utility used to log compensation issues without interrupting the main failure flow.
 */
export const logCompensationWarnings = (
  logger: Logger,
  state: Pick<DocumentUploadDTO, 'jobIdExt' | 'documentIdExt'>,
  errors: Array<Optional<Error>>,
): void => {
  for (const error of errors) {
    if (error) {
      logger.warn(
        { jobId: state.jobIdExt, documentIdExt: state.documentIdExt, error },
        'compensation: content cleanup encountered error',
      )
    }
  }
}
