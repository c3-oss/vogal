/**
 * Options for configuring invariant checks in BaseKernel.
 */
interface BaseKernelInvariantOptions {
  /** Custom error message to use for invariant violations. */
  errorMessage?: string
  /** Whether to skip checking individual object keys. */
  skipKeys?: boolean
  /** Whether to perform emptiness checks on dependencies. */
  checkEmptyness?: boolean
}

/**
 * Abstract base class providing common functionality for kernel implementations.
 * Includes invariant checking for dependency validation.
 */
export abstract class BaseKernel {
  private checkEmpty(dependencies: unknown, m: string): void {
    if (dependencies === undefined || dependencies === null) {
      throw new Error(m)
    }
  }

  private checkArray(dependencies: unknown, m: string): void {
    if (Array.isArray(dependencies) && dependencies.length === 0) {
      throw new Error(m)
    }
  }

  private checkString(dependencies: unknown, m: string): void {
    if (typeof dependencies === 'string' && dependencies === '') {
      throw new Error(m)
    }
  }

  private check(dependencies: unknown, m: string): void {
    this.checkEmpty(dependencies, m)
    this.checkString(dependencies, m)
    this.checkArray(dependencies, m)
  }

  protected invariant(dependencies: unknown, options?: BaseKernelInvariantOptions): void {
    const { errorMessage, skipKeys = false, checkEmptyness = true } = options ?? {}
    const em = errorMessage ?? `INVARIANT EXCEPTION: dependency "{{key}}" is required by "${this.constructor.name}"`

    this.checkEmpty(dependencies, em)
    if (!checkEmptyness) {
      return
    }

    if (typeof dependencies === 'function' || typeof dependencies === 'symbol') {
      return
    }

    this.check(dependencies, em)

    if (skipKeys) {
      return
    }

    const m = errorMessage ?? `INVARIANT EXCEPTION: dependency "{{key}}" is required by "${this.constructor.name}"`
    for (const [key, value] of Object.entries(dependencies as Record<string, unknown>)) {
      if (key.startsWith('$')) {
        continue
      }
      this.check(value, m.replace('{{key}}', key))
    }
  }
}
