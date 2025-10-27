// internal
import { VERR } from '~infra/errors/common/vogal-error-codes.js'
import { VError } from '~infra/errors/common/vogal-error.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Error thrown when attempting to create a resource that already exists in the system.
 *
 * Use this error when:
 * - Unique constraint violations occur during database inserts
 * - Duplicate key errors are encountered
 * - Business logic requires preventing duplicate resource creation
 * - User attempts to register with an existing email/username
 *
 * Common scenarios: create operations on repositories, user registration,
 * workspace creation where names must be unique.
 */
export class VErrorAlreadyExists extends VError {
  name = 'VErrorAlreadyExists'
  internalCode = VERR.ALREADY_EXISTS
  messageFallback = 'Resource already exists'
}
