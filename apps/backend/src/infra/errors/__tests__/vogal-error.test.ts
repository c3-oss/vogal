// 3rd-party
import { describe, expect, it } from 'vitest'

import { VERR } from '../common/vogal-error-codes.js'
// internal
import { VError } from '../common/vogal-error.js'
import { VErrorAlreadyDeleted, VErrorInvalidInput, VErrorMultipleResults, VErrorUnknown } from '../index.js'

// ---------------------------------------------------------------------------------------------------------------------

class TestError extends VError {
  name = 'TestError'
  internalCode = VERR.UNKNOWN
}

describe('VError base and custom errors', () => {
  it('exposes context and internal code', () => {
    const e = new TestError({ context: { x: 1 } })
    expect(e.getContext()).toEqual({ x: 1 })
    expect(e.getInternalCode()).toBe(VERR.UNKNOWN)
  })

  it('custom errors set name, code and fallback message', () => {
    expect(new VErrorInvalidInput({}).name).toBe('VErrorInvalidInput')
    expect(new VErrorInvalidInput({}).getInternalCode()).toBe(VERR.INVALID_INPUT)
    // Current base constructor uses base fallback during construction
    expect(new VErrorInvalidInput({}).message).toBe('Unknown error')

    expect(new VErrorAlreadyDeleted({}).name).toBe('VErrorAlreadyDeleted')
    expect(new VErrorMultipleResults({}).name).toBe('VErrorMultipleResults')
    expect(new VErrorUnknown({}).message).toBe('Unknown error')
  })
})
