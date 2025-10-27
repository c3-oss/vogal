// internal
import { VERR } from '~infra/errors/common/vogal-error-codes.js'
import { VError } from '~infra/errors/common/vogal-error.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Error thrown when database constraint violations occur beyond simple uniqueness checks.
 *
 * Use this error when:
 * - Foreign key constraint violations (e.g., workspace-user relationships)
 * - Check constraint violations
 * - Referential integrity errors
 * - Cascade delete/update failures
 *
 * Common scenarios: Attempting to delete referenced records, inserting records with
 * invalid foreign keys, violating database check constraints.
 */
export class VErrorConstraintViolation extends VError {
  name = 'VErrorConstraintViolation'
  internalCode = VERR.CONSTRAINT_VIOLATION
  messageFallback = 'Database constraint violation'
}
