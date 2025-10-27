// 3rd-party
import type { FastifyReply as Reply, FastifyRequest as Request } from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import { type ZodError, z } from 'zod'

// internal
import { VError } from '~infra/errors/index.js'
import { errorHandler } from '../error-handler.js'

// ---------------------------------------------------------------------------------------------------------------------

const mockReply = () => {
  const reply: any = {}
  reply.status = vi.fn().mockReturnValue(reply)
  reply.send = vi.fn().mockReturnValue(reply)
  reply.sent = false
  return reply as Reply
}

class TestVError extends VError {
  name = 'TestVError'
}

describe('errorHandler middleware', () => {
  it('returns early when reply already sent', () => {
    const reply = mockReply()
    reply.sent = true
    const err = new Error('boom')
    const result = errorHandler(err as any, {} as Request, reply)
    expect(result).toBeUndefined()
    expect(reply.status).not.toHaveBeenCalled()
  })

  it('handles ZodError as invalid input', () => {
    const reply = mockReply()

    const schema = z.object({ a: z.string() })
    const parsed = schema.safeParse({ a: 1 })
    const err = (parsed as any).error as ZodError

    errorHandler(err as any, {} as Request, reply)
    expect(reply.status).toHaveBeenCalledWith(400)
    expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({ error: 'VErrorInvalidInput' }))
  })

  it('handles VError using mapping', () => {
    const reply = mockReply()
    const err = new TestVError({ message: 't' })

    errorHandler(err as any, {} as Request, reply)
    expect(reply.status).toHaveBeenCalled()
    expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({ error: 'TestVError', message: 't' }))
  })

  it('handles SyntaxError as malformed request', () => {
    const reply = mockReply()
    const err = new SyntaxError('bad json')

    errorHandler(err as any, {} as Request, reply)
    expect(reply.status).toHaveBeenCalledWith(400)
    expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({ error: 'VErrorMalformedRequest' }))
  })

  it('handles unknown Error to VErrorUnknown', () => {
    const reply = mockReply()
    const err = new Error('unknown')

    errorHandler(err as any, {} as Request, reply)
    expect(reply.status).toHaveBeenCalledWith(500)
    expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({ error: 'VErrorUnknown', message: 'unknown' }))
  })
})
