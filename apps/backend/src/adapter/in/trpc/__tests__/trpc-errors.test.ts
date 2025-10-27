// 3rd-party
import { err, none, ok, some } from '@c3-oss/functional'
import { TRPCError } from '@trpc/server'
import { describe, expect, it } from 'vitest'

// internal
import { VERR, VErrorInvalidInput } from '~infra/errors/index.js'
import { mapVERRToTRPC, rightOrThrow, someOrThrow, toTRPCError } from '../trpc-errors.js'

// ---------------------------------------------------------------------------------------------------------------------

describe('mapVERRToTRPC', () => {
  it('should map INVALID_INPUT to BAD_REQUEST', () => {
    expect(mapVERRToTRPC(VERR.INVALID_INPUT)).toBe('BAD_REQUEST')
  })

  it('should map MALFORMED_REQUEST to BAD_REQUEST', () => {
    expect(mapVERRToTRPC(VERR.MALFORMED_REQUEST)).toBe('BAD_REQUEST')
  })

  it('should map INVALID_STATE to BAD_REQUEST', () => {
    expect(mapVERRToTRPC(VERR.INVALID_STATE)).toBe('BAD_REQUEST')
  })

  it('should map FILE_TOO_LARGE to PAYLOAD_TOO_LARGE', () => {
    expect(mapVERRToTRPC(VERR.FILE_TOO_LARGE)).toBe('PAYLOAD_TOO_LARGE')
  })

  it('should map NOT_FOUND to NOT_FOUND', () => {
    expect(mapVERRToTRPC(VERR.NOT_FOUND)).toBe('NOT_FOUND')
  })

  it('should map ALREADY_DELETED to CONFLICT', () => {
    expect(mapVERRToTRPC(VERR.ALREADY_DELETED)).toBe('CONFLICT')
  })

  it('should map ALREADY_EXISTS to CONFLICT', () => {
    expect(mapVERRToTRPC(VERR.ALREADY_EXISTS)).toBe('CONFLICT')
  })

  it('should map CONSTRAINT_VIOLATION to CONFLICT', () => {
    expect(mapVERRToTRPC(VERR.CONSTRAINT_VIOLATION)).toBe('CONFLICT')
  })

  it('should map RATE_LIMITED to TOO_MANY_REQUESTS', () => {
    expect(mapVERRToTRPC(VERR.RATE_LIMITED)).toBe('TOO_MANY_REQUESTS')
  })

  it('should map OPERATION_TIMEOUT to TIMEOUT', () => {
    expect(mapVERRToTRPC(VERR.OPERATION_TIMEOUT)).toBe('TIMEOUT')
  })

  it('should map unknown errors to INTERNAL_SERVER_ERROR', () => {
    expect(mapVERRToTRPC('UNKNOWN' as any)).toBe('INTERNAL_SERVER_ERROR')
  })
})

describe('toTRPCError', () => {
  it('should return TRPCError as-is', () => {
    const originalError = new TRPCError({ code: 'BAD_REQUEST', message: 'Test error' })
    const result = toTRPCError(originalError)
    expect(result).toBe(originalError)
  })

  it('should convert VError to TRPCError', () => {
    const VError = new VErrorInvalidInput({ message: 'Invalid input' })
    const result = toTRPCError(VError)

    expect(result).toBeInstanceOf(TRPCError)
    expect(result.code).toBe('BAD_REQUEST')
    expect(result.message).toBe('Invalid input')
    expect(result.cause).toBe(VError)
  })

  it('should convert generic Error to TRPCError with INTERNAL_SERVER_ERROR', () => {
    const error = new Error('Generic error')
    const result = toTRPCError(error)

    expect(result).toBeInstanceOf(TRPCError)
    expect(result.code).toBe('INTERNAL_SERVER_ERROR')
    expect(result.message).toBe('Generic error')
    expect(result.cause).toBe(error)
  })
})

describe('rightOrThrow', () => {
  it('should throw TRPCError when result is Err', () => {
    const error = new Error('Test error')
    const failable = err(error)

    expect(() => rightOrThrow(failable)).toThrow(TRPCError)
  })

  it('should return value when result is Ok', () => {
    const value = 'success'
    const failable = ok(value)

    const result = rightOrThrow(failable)
    expect(result).toBe(value)
  })
})

describe('someOrThrow', () => {
  it('should throw TRPCError when option is None', () => {
    const option = none

    expect(() => someOrThrow(option)).toThrow(TRPCError)
    expect(() => someOrThrow(option)).toThrow('Resource not found')
  })

  it('should throw TRPCError with custom message when option is None', () => {
    const option = none
    const customMessage = 'Custom not found message'

    expect(() => someOrThrow(option, customMessage)).toThrow(TRPCError)
    expect(() => someOrThrow(option, customMessage)).toThrow(customMessage)
  })

  it('should return value when option is Some', () => {
    const value = 'test value'
    const option = some(value)

    const result = someOrThrow(option)
    expect(result).toBe(value)
  })
})
