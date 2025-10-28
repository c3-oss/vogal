// 3rd-party
import CircuitBreaker, { type Options as OpossumOptions } from 'opossum'
import { env } from '~infra/config/env.js'

// ---------------------------------------------------------------------------------------------------------------------

export interface BreakerOptions extends OpossumOptions {
  enabled?: boolean
}

export interface GenericBreaker {
  fire<T>(fn: () => Promise<T>): Promise<T>
}

export function createGenericBreaker(options?: BreakerOptions): GenericBreaker {
  const merged: BreakerOptions = {
    timeout: 10_000,
    errorThresholdPercentage: 50,
    resetTimeout: 30_000,
    enabled: env.VOGAL_CB_ENABLED,
    ...(options ?? {}),
  }
  const { enabled = env.VOGAL_CB_ENABLED, ...ops } = merged

  if (!enabled) {
    return {
      fire: async <T>(fn: () => Promise<T>) => fn(),
    }
  }

  // Internally type the breaker on unknown to keep it reusable across call-sites
  const breaker: CircuitBreaker<[() => Promise<unknown>], unknown> = new CircuitBreaker(
    async (fn: () => Promise<unknown>) => fn(),
    ops,
  )

  return {
    fire: <T>(fn: () => Promise<T>) => breaker.fire(fn) as Promise<T>,
  }
}
