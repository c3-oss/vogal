// internal
import { VERR } from '~infra/errors/common/vogal-error-codes.js'
import { VError } from '~infra/errors/common/vogal-error.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Error thrown when input data fails validation or business logic constraints.
 *
 * Use this error when:
 * - Input parameters don't meet required validation rules
 * - Business logic constraints are violated (e.g., invalid date ranges, negative values)
 * - Data transformation fails due to incompatible input formats
 * - Domain-specific validation rules are not satisfied
 *
 * Common scenarios: controller input validation, use case business rule validation,
 * data processing where input format expectations are not met.
 */
export class VErrorInvalidInput extends VError {
  name = 'VErrorInvalidInput'
  internalCode = VERR.INVALID_INPUT
  messageFallback = 'Invalid input'
}
