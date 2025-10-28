// standard
import fs from 'node:fs/promises'

// internal
import type { Logger } from '@c3-oss/logger'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Removes the temporary upload file associated with an ingestion job,
 * swallowing ENOENT to avoid noisy logs when retries already cleaned it up.
 */
export const removeTempFile = async (filePath: string, logger: Logger): Promise<void> => {
  try {
    await fs.unlink(filePath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') {
      logger.warn({ filePath, error }, 'failed to remove temporary upload file')
    }
  }
}
