// c3
import type { Nullable } from '@c3-oss/types'

// internal
import type { DocumentUploadDTO } from './types.js'
import { STEP_ORDER, type UploadStep } from './types.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Maps a step name to its index in STEP_ORDER so comparisons remain simple.
 */
export const getStepIndex = (step?: Nullable<UploadStep>): number => STEP_ORDER.indexOf(step ?? 'pending')

/**
 * Determines if the workflow has already cleared the given step.
 */
export const hasCompleted = (state: DocumentUploadDTO, step: UploadStep): boolean =>
  getStepIndex(state.lastCompletedStep) >= getStepIndex(step)

/**
 * Returns the next step the saga should attempt based on persisted state.
 */
export const getNextPendingStep = (state: DocumentUploadDTO): UploadStep => {
  for (const step of STEP_ORDER) {
    if (step === 'pending') {
      continue
    }
    if (!hasCompleted(state, step)) {
      return step
    }
  }
  return 'finalized'
}
