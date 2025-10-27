// internal
import { VERR } from '~infra/errors/common/vogal-error-codes.js'
import { VError } from '~infra/errors/common/vogal-error.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Error thrown when file content type or format is invalid.
 *
 * Use this error when:
 * - Uploaded file is not a PDF when PDF is expected
 * - Content-Type header doesn't match expected format
 * - File extension doesn't match content
 * - Unsupported file format is provided
 *
 * Common scenarios: Document upload validation, file format checks,
 * ensuring only supported document types are processed.
 */
export class VErrorInvalidContentType extends VError {
  name = 'VErrorInvalidContentType'
  internalCode = VERR.INVALID_CONTENT_TYPE
  messageFallback = 'Invalid content type'
}
