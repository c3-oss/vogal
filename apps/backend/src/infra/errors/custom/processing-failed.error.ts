// internal
import { VERR } from '~infra/errors/common/vogal-error-codes.js'
import { VError } from '~infra/errors/common/vogal-error.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Error thrown when content processing operations fail.
 *
 * Use this error when:
 * - PDF parsing or text extraction fails
 * - Text normalization operations encounter errors
 * - Vector embedding generation fails
 * - Document content transformation fails
 *
 * Common scenarios: PDF processing pipeline, text normalization, embedding generation,
 * content extraction from various document formats.
 */
export class VErrorProcessingFailed extends VError {
  name = 'VErrorProcessingFailed'
  internalCode = VERR.PROCESSING_FAILED
  messageFallback = 'Content processing failed'
}
