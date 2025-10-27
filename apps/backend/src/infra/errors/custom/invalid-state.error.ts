// internal
import { VERR } from '~infra/errors/common/vogal-error-codes.js'
import { VError } from '~infra/errors/common/vogal-error.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Error thrown when operations are attempted on resources in an invalid state.
 *
 * Use this error when:
 * - Attempting to use a workspace before collection initialization
 * - Performing operations on documents with incorrect status
 * - State transitions that are not allowed by business rules
 * - Lifecycle violations (e.g., processing already-processed documents)
 *
 * Common scenarios: Using uninitialized workspaces, operating on soft-deleted resources,
 * invalid state machine transitions, prerequisite operations not completed.
 */
export class VErrorInvalidState extends VError {
  name = 'VErrorInvalidState'
  internalCode = VERR.INVALID_STATE
  messageFallback = 'Invalid resource state'
}
