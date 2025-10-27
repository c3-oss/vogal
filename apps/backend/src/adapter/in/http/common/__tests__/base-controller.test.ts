// 3rd-party
import { describe, expect, it } from 'vitest'

// internal
import { BaseController } from '../base-controller.js'

// ---------------------------------------------------------------------------------------------------------------------

class TestController extends BaseController {
  public checkInvariant(input: unknown, message?: string): void {
    this.invariant(input, message ? { errorMessage: message } : undefined)
  }
}

describe('BaseController.invariant', () => {
  it('throws when dependency object contains undefined values', () => {
    const controller = new TestController()
    expect(() => controller.checkInvariant({ a: 1, b: undefined })).toThrowError(
      /INVARIANT EXCEPTION: dependency "b" is required/,
    )
  })

  it('throws when dependency is falsy (null)', () => {
    const controller = new TestController()
    expect(() => controller.checkInvariant(null)).toThrowError(
      /INVARIANT EXCEPTION: dependency "\{\{key\}\}" is required/,
    )
  })

  it('throws when dependency is falsy (empty string)', () => {
    const controller = new TestController()
    expect(() => controller.checkInvariant('')).toThrowError(
      /INVARIANT EXCEPTION: dependency "\{\{key\}\}" is required/,
    )
  })
})
