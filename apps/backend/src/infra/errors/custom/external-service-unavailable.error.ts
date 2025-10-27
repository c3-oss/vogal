// internal
import { VERR } from '~infra/errors/common/vogal-error-codes.js'
import { VError } from '~infra/errors/common/vogal-error.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Error thrown when external service dependencies are unavailable or fail to respond.
 *
 * Use this error when:
 * - Vector database (Qdrant) connection fails
 * - Embedding API service is unreachable
 * - External normalizer service is down
 * - Third-party API calls timeout or return connection errors
 *
 * Common scenarios: Qdrant connection failures, embedding service downtime,
 * external API unavailability, network connectivity issues with dependencies.
 */
export class VErrorExternalServiceUnavailable extends VError {
  name = 'VErrorExternalServiceUnavailable'
  internalCode = VERR.EXTERNAL_SERVICE_UNAVAILABLE
  messageFallback = 'External service unavailable'
}
