// c3
import { isErr, isSome } from '@c3-oss/functional'

// internal
import { runCompensations } from './compensations.js'
import { extractErrorMessage } from './errors.js'
import type { DocumentUploadDTO } from './types.js'
import type { SagaDependencies } from './types.js'

// ---------------------------------------------------------------------------------------------------------------------

type FailureDeps = Pick<SagaDependencies, 'logger' | 'writer' | 'uploads' | 'storage' | 'vectorRepository'>

/**
 * Centralized failure handler invoked by every saga step.
 * It runs compensations, updates persisted state, and records the failure reason.
 */
export const handleFailure = async (state: DocumentUploadDTO, cause: unknown, deps: FailureDeps): Promise<void> => {
  const errorMessage = extractErrorMessage(cause)

  deps.logger.error(
    { jobId: state.jobIdExt, documentIdExt: state.documentIdExt, error: cause },
    'saga: ingestion failed, executing compensations',
  )

  await runCompensations(state, deps)

  const documentUpdate = await deps.writer.updateDocument(state.documentIdExt, {
    status: 'failed',
    failureReason: errorMessage,
  })

  if (isErr(documentUpdate)) {
    deps.logger.error(
      { documentIdExt: state.documentIdExt, error: documentUpdate.left },
      'failed to update document status',
    )
  }

  const uploadUpdate = await deps.uploads.updateById(state.id, {
    status: 'failed',
    errorMessage,
    finishedAt: new Date(),
    heartbeatAt: new Date(),
  })

  if (isSome(uploadUpdate)) {
    deps.logger.error({ jobId: state.jobIdExt, error: uploadUpdate.value }, 'failed to persist upload failure state')
  }
}
