// internal
import { VERR } from '~infra/errors/common/vogal-error-codes.js'
import { VError } from '~infra/errors/common/vogal-error.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Error thrown when HTTP requests are syntactically incorrect or structurally invalid.
 *
 * Use this error when:
 * - JSON parsing fails due to malformed JSON in request body
 * - Required headers are missing or malformed
 * - URL parameters are incorrectly formatted
 * - Request structure doesn't match expected API contract
 * - Content-Type headers don't match actual request payload
 *
 * Common scenarios: HTTP controller request parsing, middleware validation,
 * API endpoint input processing where request format is invalid.
 */
export class VErrorMalformedRequest extends VError {
  name = 'VErrorMalformedRequest'
  internalCode = VERR.MALFORMED_REQUEST
  messageFallback = 'Malformed request'
}
