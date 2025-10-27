// internal
import type { Jsonifiable } from '~infra/contracts.js'
import { VERR } from './vogal-error-codes.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Input parameters for creating Vogal error instances.
 */
export interface VErrorInput {
  /** Error name identifier. */
  name: string
  /** Human-readable error message. */
  message: string
  /** Additional context data for debugging. */
  context: Jsonifiable
}

/**
 * Base class for Vogal-specific errors with structured context and error codes.
 */
export abstract class VError extends Error {
  protected readonly messageFallback: string = 'Unknown error'
  protected readonly internalCode: VERR = VERR.UNKNOWN
  protected readonly context: Jsonifiable

  public constructor(input: Partial<VErrorInput>) {
    super()

    this.context = input.context
    this.message = input.message ?? this.messageFallback
  }

  public getContext(): Jsonifiable {
    return this.context
  }

  public getInternalCode(): VERR {
    return this.internalCode
  }
}
