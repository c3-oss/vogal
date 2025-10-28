// c3
import { type Option, isErr, isSome, none, some } from '@c3-oss/functional'

// internal
import { VErrorUnknown } from '~infra/errors/index.js'
import type { DocumentUploadDTO } from '../types.js'
import type { SagaDependencies } from '../types.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Wraps up the ingestion saga once all steps have succeeded.
 * It transitions both the document and upload records into their terminal states.
 */
export const finalizeSuccess = async (
  state: DocumentUploadDTO,
  deps: Pick<SagaDependencies, 'uploads' | 'writer' | 'logger'>,
): Promise<Option<Error>> => {
  deps.logger.info(
    { jobId: state.jobIdExt, documentIdExt: state.documentIdExt },
    'saga: finalizing successful ingestion',
  )

  const documentUpdate = await deps.writer.updateDocument(state.documentIdExt, {
    status: 'ready',
    failureReason: null,
  })

  if (isErr(documentUpdate)) {
    const error =
      documentUpdate.left instanceof Error
        ? documentUpdate.left
        : new VErrorUnknown({
            message: 'Failed to update document to ready',
            context: { documentIdExt: state.documentIdExt },
          })
    return some(error)
  }

  const uploadUpdate = await deps.uploads.updateById(state.id, {
    status: 'completed',
    lastCompletedStep: 'finalized',
    currentStep: 'finalized',
    finishedAt: new Date(),
    heartbeatAt: new Date(),
    errorMessage: null,
  })

  if (isSome(uploadUpdate)) {
    return uploadUpdate
  }

  deps.logger.info(
    { jobId: state.jobIdExt, documentIdExt: state.documentIdExt },
    'saga: ingestion completed successfully',
  )
  return none
}
