// c3
import { type Failable, err, isErr, isSome, ok } from '@c3-oss/functional'

// internal
import { getNextPendingStep } from '../progression.js'
import type { DocumentUploadDTO } from '../types.js'
import type { SagaDependencies } from '../types.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Updates the upload/document records to reflect that processing is underway,
 * returning the fresh state snapshot so the saga can proceed confidently.
 */
export const markProcessing = async (
  state: DocumentUploadDTO,
  deps: Pick<SagaDependencies, 'uploads' | 'writer'>,
): Promise<Failable<DocumentUploadDTO>> => {
  const now = new Date()
  const nextStep = getNextPendingStep(state)

  const uploadUpdate = await deps.uploads.updateById(state.id, {
    status: 'processing',
    currentStep: nextStep,
    startedAt: state.startedAt ?? now,
    heartbeatAt: now,
    errorMessage: null,
  })

  if (isSome(uploadUpdate)) {
    return err(uploadUpdate.value)
  }

  const documentUpdate = await deps.writer.updateDocument(state.documentIdExt, {
    status: 'processing',
    failureReason: null,
  })

  if (isErr(documentUpdate)) {
    return err(documentUpdate.left)
  }

  return ok({
    ...state,
    status: 'processing',
    currentStep: nextStep,
    startedAt: state.startedAt ?? now,
    heartbeatAt: now,
    errorMessage: null,
  })
}
