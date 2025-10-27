// 3rd-party
import type { FastifyReply as Reply, FastifyRequest as Request, FastifyError as ServerError } from 'fastify'
import _ from 'lodash'
import { ZodError } from 'zod'

// internal
import { VErrorMalformedRequest } from '~/infra/errors/custom/malformed-request.error.js'
import { VERR, VError, VErrorInvalidInput, VErrorUnknown } from '~infra/errors/index.js'

// ---------------------------------------------------------------------------------------------------------------------

const errorCodeTranslationTable = {
  // 400
  [VERR.INVALID_INPUT]: 400,
  [VERR.MALFORMED_REQUEST]: 400,
  [VERR.INVALID_STATE]: 400,
  [VERR.FILE_TOO_LARGE]: 413,
  [VERR.INVALID_CONTENT_TYPE]: 415,
  [VERR.NOT_FOUND]: 404,
  [VERR.ALREADY_DELETED]: 409,
  [VERR.ALREADY_EXISTS]: 409,
  [VERR.CONSTRAINT_VIOLATION]: 409,

  // 500
  [VERR.MULTIPLE_RESULTS]: 500,
  [VERR.PROCESSING_FAILED]: 500,
  [VERR.EXTERNAL_SERVICE_UNAVAILABLE]: 503,
  [VERR.RATE_LIMITED]: 429,
  [VERR.OPERATION_TIMEOUT]: 504,
  [VERR.UNKNOWN]: 500,
} as const

const sendErrorResponse = (reply: Reply, error: VError) => {
  const code = error.getInternalCode()
  const httpCode = errorCodeTranslationTable[code]

  return reply.status(httpCode).send({
    code,
    httpCode,
    error: error.name,
    message: error.message,
    context: error.getContext(),
  })
}

// ---------------------------------------------------------------------------------------------------------------------

const VErrorHandler = (reply: Reply, err: VError) =>
  // ...
  sendErrorResponse(reply, err)

const zodErrorHandler = (reply: Reply, err: ZodError) =>
  // ...
  sendErrorResponse(
    reply,
    new VErrorInvalidInput({
      message: 'Input is invalid',
      context: err.issues.map((i) => _.omit(i, 'fatal')),
    }),
  )

const unknownErrorHandler = (reply: Reply, err: Error) =>
  // ...
  sendErrorResponse(reply, new VErrorUnknown({ message: err.message }))

const parseErrorHandler = (reply: Reply, err: Error) =>
  // ...
  sendErrorResponse(reply, new VErrorMalformedRequest({ message: err.message }))

// ---------------------------------------------------------------------------------------------------------------------

export const errorHandler = (error: ServerError, _request: Request, reply: Reply) => {
  if (reply.sent) {
    return
  }

  if (error instanceof ZodError) {
    return zodErrorHandler(reply, error)
  }
  if (error instanceof VError) {
    return VErrorHandler(reply, error)
  }
  if (error instanceof SyntaxError) {
    return parseErrorHandler(reply, error)
  }

  return unknownErrorHandler(reply, error)
}
