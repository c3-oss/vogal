// internal
import { VERR } from '~infra/errors/common/vogal-error-codes.js'
import { VError } from '~infra/errors/common/vogal-error.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Error thrown when external service rate limits are exceeded.
 *
 * Use this error when:
 * - Embedding API rate limits are hit
 * - Vector database throttling occurs
 * - Third-party API request quotas are exceeded
 * - Too many requests in a given time window
 *
 * Common scenarios: Batch document processing hitting API limits, concurrent
 * embedding generation exceeding quotas, rapid successive queries to rate-limited services.
 */
export class VErrorRateLimited extends VError {
  name = 'VErrorRateLimited'
  internalCode = VERR.RATE_LIMITED
  messageFallback = 'Rate limit exceeded'
}
