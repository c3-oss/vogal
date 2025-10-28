// c3
import { type Failable, err, isNone, isSome, ok } from '@c3-oss/functional'

// internal
import { VErrorInvalidState } from '~infra/errors/index.js'
import type { DocumentUploadDTO, StorageProvider } from '../types.js'
import type { SagaDependencies } from '../types.js'

// ---------------------------------------------------------------------------------------------------------------------

type FileReferenceDeps = Pick<SagaDependencies, 'uploads' | 'writer' | 'logger'>

/**
 * Persists the linkage between the database document record and the remote storage object.
 * If persisting the upload row fails afterwards we eagerly remove the dangling reference.
 */
export const performFileReference = async (
  state: DocumentUploadDTO,
  deps: FileReferenceDeps,
): Promise<Failable<DocumentUploadDTO>> => {
  if (!(state.storageProvider && state.storageBucket && state.storageObjectKey)) {
    return err(new VErrorInvalidState({ message: 'storage metadata missing for file reference step' }))
  }

  deps.logger.debug({ jobId: state.jobIdExt, documentIdExt: state.documentIdExt }, 'step: persisting file reference')

  const provider = state.storageProvider as StorageProvider

  const attachResult = await deps.writer.attachFileReference({
    documentId: state.documentId,
    provider,
    bucket: state.storageBucket,
    objectKey: state.storageObjectKey,
    publicUrl: null,
  })

  if (isSome(attachResult)) {
    return err(attachResult.value)
  }

  const fileReferenceDetails = {
    lastCompletedStep: 'file_reference' as const,
    currentStep: 'content_indexed' as const,
  }

  const updateResult = await deps.uploads.updateById(state.id, { ...fileReferenceDetails, heartbeatAt: new Date() })
  if (isNone(updateResult)) {
    return ok({ ...state, ...fileReferenceDetails })
  }

  await deps.writer.deleteFileReference(state.documentId)
  return err(updateResult.value)
}
