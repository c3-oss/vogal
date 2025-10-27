// internal
import { VERR } from '~infra/errors/common/vogal-error-codes.js'
import { VError } from '~infra/errors/common/vogal-error.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Error thrown when a requested resource cannot be found in the system.
 *
 * Use this error when:
 * - Database queries return no results for a specific resource ID
 * - File system operations fail to locate expected files
 * - External service calls return 404 responses
 * - User attempts to access non-existent resources
 *
 * Common scenarios: get operations on repositories, file access, external API calls.
 */
export class VErrorNotFound extends VError {
  name = 'VErrorNotFound'
  internalCode = VERR.NOT_FOUND
  messageFallback = 'Resource not found'
}
