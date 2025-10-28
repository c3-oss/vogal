// c3
import { type Failable, err, isErr, isNone, ok, val } from '@c3-oss/functional'

// internal
import { safeRemoveRemoteFile } from '../storage.js'
import type { DocumentUploadDTO } from '../types.js'
import type { SagaDependencies } from '../types.js'

// ---------------------------------------------------------------------------------------------------------------------

type StorageUploadDeps = Pick<SagaDependencies, 'uploads' | 'storage' | 'logger'>

/**
 * Sends the PDF to the configured storage provider and persists the resulting keys.
 * A failed upload is compensated by deleting any remote object that was already created.
 */
export const performStorageUpload = async (
  state: DocumentUploadDTO,
  deps: StorageUploadDeps,
): Promise<Failable<DocumentUploadDTO>> => {
  deps.logger.debug({ jobId: state.jobIdExt, documentIdExt: state.documentIdExt }, 'step: uploading to remote storage')

  const uploadResult = await deps.storage.upload({
    documentIdExt: state.documentIdExt,
    filename: state.filename,
    contentType: state.contentType,
    localFilePath: state.tempFilePath,
  })

  if (isErr(uploadResult)) {
    return err(uploadResult.left)
  }

  const remote = val(uploadResult)

  const storageDetails = {
    storageProvider: remote.provider,
    storageBucket: remote.bucket,
    storageObjectKey: remote.objectKey,
    lastCompletedStep: 'storage_upload' as const,
    currentStep: 'file_reference' as const,
  }

  const updateResult = await deps.uploads.updateById(state.id, { ...storageDetails, heartbeatAt: new Date() })
  if (isNone(updateResult)) {
    return ok({ ...state, ...storageDetails })
  }

  await safeRemoveRemoteFile(deps.storage, deps.logger, remote.bucket, remote.objectKey)
  return err(updateResult.value)
}
