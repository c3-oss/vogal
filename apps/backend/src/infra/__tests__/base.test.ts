// 3rd-party
import { beforeEach, describe, expect, it } from 'vitest'

// internal
import { BaseKernel } from '../base.js'

// ---------------------------------------------------------------------------------------------------------------------

interface BaseKernelInvariantOptions {
  errorMessage?: string
  skipKeys?: boolean
  checkEmptyness?: boolean
}

// ---------------------------------------------------------------------------------------------------------------------

class TestKernel extends BaseKernel {
  public testInvariant(dependencies: unknown, options?: BaseKernelInvariantOptions): void {
    this.invariant(dependencies, options)
  }
}

describe('BaseKernel', () => {
  let kernel: TestKernel

  beforeEach(() => {
    kernel = new TestKernel()
  })

  describe('invariant', () => {
    describe('when dependencies are valid', () => {
      it('should not throw for valid object', () => {
        // Arrange
        const dependencies = {
          service: 'test',
          repository: {},
          config: { value: 'test' },
        }

        // Act & Assert
        expect(() => kernel.testInvariant(dependencies)).not.toThrow()
      })

      it('should not throw for function', () => {
        // Arrange
        const dependencies = () => 'test'

        // Act & Assert
        expect(() => kernel.testInvariant(dependencies)).not.toThrow()
      })

      it('should not throw for symbol', () => {
        // Arrange
        const dependencies = Symbol('test')

        // Act & Assert
        expect(() => kernel.testInvariant(dependencies)).not.toThrow()
      })

      it('should not throw for non-empty string', () => {
        // Arrange
        const dependencies = 'valid string'

        // Act & Assert
        expect(() => kernel.testInvariant(dependencies)).not.toThrow()
      })

      it('should not throw for non-empty array', () => {
        // Arrange
        const dependencies = [1, 2, 3]

        // Act & Assert
        expect(() => kernel.testInvariant(dependencies)).not.toThrow()
      })

      it('should not throw for number', () => {
        // Arrange
        const dependencies = 42

        // Act & Assert
        expect(() => kernel.testInvariant(dependencies)).not.toThrow()
      })

      it('should not throw for boolean', () => {
        // Arrange
        const dependencies = true

        // Act & Assert
        expect(() => kernel.testInvariant(dependencies)).not.toThrow()
      })

      it('should skip keys starting with $', () => {
        // Arrange
        const dependencies = {
          service: 'test',
          $private: undefined,
          $internal: null,
        }

        // Act & Assert
        expect(() => kernel.testInvariant(dependencies)).not.toThrow()
      })

      it('should not throw when checkEmptyness is false', () => {
        // Arrange
        const dependencies = {
          service: null,
          repository: undefined,
        }

        // Act & Assert
        expect(() => kernel.testInvariant(dependencies, { checkEmptyness: false })).not.toThrow()
      })

      it('should not throw when skipKeys is true', () => {
        // Arrange
        const dependencies = {
          service: null,
          repository: undefined,
        }

        // Act & Assert
        expect(() => kernel.testInvariant(dependencies, { skipKeys: true })).not.toThrow()
      })
    })

    describe('when dependencies are invalid', () => {
      it('should throw for null', () => {
        // Arrange
        const dependencies = null

        // Act & Assert
        expect(() => kernel.testInvariant(dependencies)).toThrow(
          'INVARIANT EXCEPTION: dependency "{{key}}" is required by "TestKernel"',
        )
      })

      it('should throw for undefined', () => {
        // Arrange
        const dependencies = undefined

        // Act & Assert
        expect(() => kernel.testInvariant(dependencies)).toThrow(
          'INVARIANT EXCEPTION: dependency "{{key}}" is required by "TestKernel"',
        )
      })

      it('should throw for empty string', () => {
        // Arrange
        const dependencies = ''

        // Act & Assert
        expect(() => kernel.testInvariant(dependencies)).toThrow(
          'INVARIANT EXCEPTION: dependency "{{key}}" is required by "TestKernel"',
        )
      })

      it('should throw for empty array', () => {
        // Arrange
        const dependencies: unknown[] = []

        // Act & Assert
        expect(() => kernel.testInvariant(dependencies)).toThrow(
          'INVARIANT EXCEPTION: dependency "{{key}}" is required by "TestKernel"',
        )
      })

      it('should throw for object with null property', () => {
        // Arrange
        const dependencies = {
          service: null,
        }

        // Act & Assert
        expect(() => kernel.testInvariant(dependencies)).toThrow(
          'INVARIANT EXCEPTION: dependency "service" is required by "TestKernel"',
        )
      })

      it('should throw for object with undefined property', () => {
        // Arrange
        const dependencies = {
          service: undefined,
        }

        // Act & Assert
        expect(() => kernel.testInvariant(dependencies)).toThrow(
          'INVARIANT EXCEPTION: dependency "service" is required by "TestKernel"',
        )
      })

      it('should throw for object with empty string property', () => {
        // Arrange
        const dependencies = {
          service: '',
        }

        // Act & Assert
        expect(() => kernel.testInvariant(dependencies)).toThrow(
          'INVARIANT EXCEPTION: dependency "service" is required by "TestKernel"',
        )
      })

      it('should throw for object with empty array property', () => {
        // Arrange
        const dependencies = {
          items: [],
        }

        // Act & Assert
        expect(() => kernel.testInvariant(dependencies)).toThrow(
          'INVARIANT EXCEPTION: dependency "items" is required by "TestKernel"',
        )
      })

      it('should use custom error message', () => {
        // Arrange
        const dependencies = null
        const customMessage = 'Custom error message for {{key}}'

        // Act & Assert
        expect(() => kernel.testInvariant(dependencies, { errorMessage: customMessage })).toThrow(
          'Custom error message for {{key}}',
        )
      })

      it('should use custom error message for object properties', () => {
        // Arrange
        const dependencies = {
          service: null,
        }
        const customMessage = 'Service {{key}} is missing'

        // Act & Assert
        expect(() => kernel.testInvariant(dependencies, { errorMessage: customMessage })).toThrow(
          'Service service is missing',
        )
      })
    })
  })
})
