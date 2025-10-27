// internal
import { VERR } from '~infra/errors/common/vogal-error-codes.js'
import { VError } from '~infra/errors/common/vogal-error.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Error thrown when uploaded files exceed size limits.
 *
 * Use this error when:
 * - PDF files exceed maximum allowed size
 * - Upload requests contain files larger than configured limits
 * - Document size exceeds processing capabilities
 * - Memory constraints are violated by file size
 *
 * Common scenarios: Document upload validation, file size checks before processing,
 * preventing resource exhaustion from oversized files.
 */
export class VErrorFileTooLarge extends VError {
  name = 'VErrorFileTooLarge'
  internalCode = VERR.FILE_TOO_LARGE
  messageFallback = 'File size exceeds limit'
}
