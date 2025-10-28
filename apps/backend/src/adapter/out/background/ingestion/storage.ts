// c3
import { isSome } from '@c3-oss/functional'
import type { Logger } from '@c3-oss/logger'

// internal
import type { StorageProviderPort } from './types.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Attempts to remove a file from remote storage as part of compensations.
 * Missing metadata short-circuits silently because not every failure reaches the upload step.
 */
export const safeRemoveRemoteFile = async (
  storage: StorageProviderPort,
  logger: Logger,
  bucket?: string,
  objectKey?: string,
): Promise<void> => {
  if (!bucket || !objectKey) {
    return
  }

  const removalResult = await storage.remove({ bucket, objectKey })

  if (isSome(removalResult)) {
    logger.warn(
      { bucket, objectKey, error: removalResult.value },
      'compensation: failed to remove file from remote storage',
    )
  }
}
