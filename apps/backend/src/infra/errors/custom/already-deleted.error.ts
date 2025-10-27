// internal
import { VERR } from '~infra/errors/common/vogal-error-codes.js'
import { VError } from '~infra/errors/common/vogal-error.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Error thrown when attempting to delete a resource that has already been deleted.
 *
 * Use this error when:
 * - Delete operations are attempted on soft-deleted records
 * - Resources are marked as deleted but still exist in database
 * - Business logic requires preventing double deletion attempts
 *
 * Common scenarios: delete operations on repositories where soft deletes are used,
 * cleanup operations that should not affect already removed resources.
 */
export class VErrorAlreadyDeleted extends VError {
  name = 'VErrorAlreadyDeleted'
  internalCode = VERR.ALREADY_DELETED
  messageFallback = 'Resource already deleted'
}
