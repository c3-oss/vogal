// c3
import { type Failable, err, isSome, ok } from '@c3-oss/functional'

// internal
import { VErrorInvalidState } from '~infra/errors/index.js'
import type { DocumentUploadDTO, StorageProvider } from '../types.js'
import type { SagaDependencies } from '../types.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Persists the linkage between the database document record and the remote storage object.
 * If persisting the upload row fails afterwards we eagerly remove the dangling reference.
 */
export const performFileReference = async (
  state: DocumentUploadDTO,
  deps: Pick<SagaDependencies, 'uploads' | 'writer' | 'logger'>,
): Promise<Failable<DocumentUploadDTO>> => {
  if (!state.storageProvider || !state.storageBucket || !state.storageObjectKey) {
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

  const updateResult = await deps.uploads.updateById(state.id, {
    lastCompletedStep: 'file_reference',
    currentStep: 'content_indexed',
    heartbeatAt: new Date(),
  })

  if (isSome(updateResult)) {
    await deps.writer.deleteFileReference(state.documentId)
    return err(updateResult.value)
  }

  return ok({
    ...state,
    lastCompletedStep: 'file_reference',
    currentStep: 'content_indexed',
  })
}
