// internal
import { VError } from '~infra/errors/common/vogal-error.js'
import { VERR } from '../common/vogal-error-codes.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Error thrown when an unexpected or unhandled error occurs in the system.
 *
 * Use this error when:
 * - Unexpected runtime exceptions occur
 * - External service failures happen without specific error context
 * - System-level errors that don't fit other specific error categories
 * - Fallback error for cases where proper error classification is not possible
 *
 * Common scenarios: catch-all error handlers, external service failures,
 * unexpected system states that cannot be properly categorized.
 */
export class VErrorUnknown extends VError {
  name = 'VErrorUnknown'
  internalCode = VERR.UNKNOWN
  messageFallback = 'Unknown error'
}
