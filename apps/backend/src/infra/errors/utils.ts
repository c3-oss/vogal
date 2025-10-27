// c3
import { type Failable, err, ok } from '@c3-oss/functional'

// internal
import type { Jsonifiable } from '~infra/contracts.js'
import { VErrorUnknown } from '~infra/errors/index.js'

// ---------------------------------------------------------------------------------------------------------------------

export interface UnknownContext extends Record<string, Jsonifiable | undefined> {}

export const fromThrowable = async <T>(
  fn: () => Promise<T> | T,
  mapToError: (e: unknown) => Error = (e) =>
    new VErrorUnknown({
      message: 'Unhandled exception',
      context: { reason: e instanceof Error ? e.message : String(e) },
    }),
): Promise<Failable<T>> => {
  try {
    const value = await fn()
    return ok(value)
  } catch (e) {
    return err(mapToError(e))
  }
}

export const mapUnknownToVError = (e: unknown, message: string, context?: UnknownContext): Error =>
  new VErrorUnknown({
    message,
    context: {
      ...context,
      reason: e instanceof Error ? e.message : String(e),
    },
  })
