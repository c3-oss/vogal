// internal
import { VERR } from '~infra/errors/common/vogal-error-codes.js'
import { VError } from '~infra/errors/common/vogal-error.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Error thrown when a query that should return a single result finds multiple matches.
 *
 * Use this error when:
 * - Unique queries return more than one record unexpectedly
 * - Business logic expects exactly one result but gets multiple
 * - Data integrity issues cause duplicate records to exist
 * - Operations that require singular results encounter ambiguity
 *
 * Common scenarios: getByEmail operations, unique constraint lookups,
 * operations expecting single entity results from database queries.
 */
export class VErrorMultipleResults extends VError {
  name = 'VErrorMultipleResults'
  internalCode = VERR.MULTIPLE_RESULTS
  messageFallback = 'Multiple results found'
}
