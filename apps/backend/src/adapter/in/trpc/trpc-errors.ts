// c3
import { type Failable, type Option, isErr, isNone, isSome } from '@c3-oss/functional'
import { TRPCError } from '@trpc/server'

// internal
import { VERR, VError, VErrorNotFound } from '~infra/errors/index.js'

// ---------------------------------------------------------------------------------------------------------------------

export const mapVERRToTRPC = (code: VERR): TRPCError['code'] => {
  switch (code) {
    // 400s
    case VERR.INVALID_INPUT:
    case VERR.MALFORMED_REQUEST:
    case VERR.INVALID_STATE:
      return 'BAD_REQUEST'
    case VERR.FILE_TOO_LARGE:
      return 'PAYLOAD_TOO_LARGE'
    case VERR.NOT_FOUND:
      return 'NOT_FOUND'
    case VERR.ALREADY_DELETED:
    case VERR.ALREADY_EXISTS:
    case VERR.CONSTRAINT_VIOLATION:
      return 'CONFLICT'
    case VERR.RATE_LIMITED:
      return 'TOO_MANY_REQUESTS'
    case VERR.OPERATION_TIMEOUT:
      return 'TIMEOUT'

    // 5xx and fallback
    default:
      return 'INTERNAL_SERVER_ERROR'
  }
}

export const toTRPCError = (e: unknown): TRPCError => {
  if (e instanceof TRPCError) return e
  if (e instanceof VError) {
    return new TRPCError({ code: mapVERRToTRPC(e.getInternalCode()), message: e.message, cause: e })
  }
  if (e instanceof Error) {
    return new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: e.message, cause: e })
  }
  return new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unknown error', cause: e as unknown })
}

export const rightOrThrow = <T>(fa: Failable<T>): T => {
  if (isErr(fa)) {
    throw toTRPCError(fa.left)
  }
  return fa.right
}

export const someOrThrow = <T>(opt: Option<T>, notFoundMessage = 'Resource not found'): T => {
  if (isNone(opt)) {
    throw toTRPCError(new VErrorNotFound({ message: notFoundMessage }))
  }
  if (isSome(opt)) return opt.value
  // unreachable fallback (keeps type system satisfied)
  throw toTRPCError(new VErrorNotFound({ message: notFoundMessage }))
}
