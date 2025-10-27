// internal
import { VERR } from '~infra/errors/common/vogal-error-codes.js'
import { VError } from '~infra/errors/common/vogal-error.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Error thrown when operations exceed their allocated timeout period.
 *
 * Use this error when:
 * - PDF processing takes longer than timeout threshold
 * - Vector database queries exceed time limits
 * - Embedding generation times out
 * - External service calls don't respond within timeout window
 *
 * Common scenarios: Processing very large PDFs, complex vector searches,
 * slow external service responses, network latency issues.
 */
export class VErrorOperationTimeout extends VError {
  name = 'VErrorOperationTimeout'
  internalCode = VERR.OPERATION_TIMEOUT
  messageFallback = 'Operation timeout'
}
