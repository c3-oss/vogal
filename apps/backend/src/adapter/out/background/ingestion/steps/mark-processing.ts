// c3
import { type Failable, err, isErr, isSome, ok } from '@c3-oss/functional'

// internal
import { getNextPendingStep } from '../progression.js'
import type { DocumentUploadDTO } from '../types.js'
import type { SagaDependencies } from '../types.js'

// ---------------------------------------------------------------------------------------------------------------------

type MarkProcessingDeps = Pick<SagaDependencies, 'uploads' | 'writer'>

/**
 * Updates the upload/document records to reflect that processing is underway,
 * returning the fresh state snapshot so the saga can proceed confidently.
 */
export const markProcessing = async (
  state: DocumentUploadDTO,
  deps: MarkProcessingDeps,
): Promise<Failable<DocumentUploadDTO>> => {
  const now = new Date()
  const nextStep = getNextPendingStep(state)

  const processingDetails = {
    status: 'processing' as const,
    currentStep: nextStep,
    startedAt: state.startedAt ?? now,
    heartbeatAt: now,
    errorMessage: null,
  }

  const uploadUpdate = await deps.uploads.updateById(state.id, processingDetails)
  if (isSome(uploadUpdate)) {
    return err(uploadUpdate.value)
  }

  const documentUpdate = await deps.writer.updateDocument(state.documentIdExt, {
    status: 'processing',
    failureReason: null,
  })

  return isErr(documentUpdate) ? err(documentUpdate.left) : ok({ ...state, ...processingDetails })
}
