// c3
import type { Logger } from '@c3-oss/logger'

// ---------------------------------------------------------------------------------------------------------------------

export interface CachePort {
  /** Retrieve a JSON value stored at key. Returns null when missing. */
  getJSON<T>(key: string): Promise<T | null>
  /** Store a JSON value at key and set TTL in seconds. */
  setJSON<T>(key: string, value: T, ttlSeconds: number): Promise<void>
  /** Reset key TTL in seconds (sliding expiration). */
  expire(key: string, ttlSeconds: number): Promise<void>
  /** Delete a specific key. */
  del(key: string): Promise<void>
  /** Delete keys by SCAN pattern. Returns number of deleted keys. */
  delByPattern(pattern: string): Promise<number>
  /** Close underlying client connections. */
  close(): Promise<void>
}

export interface CacheKeyBuilder {
  buildKey: (...parts: string[]) => string
}

export interface CacheFactoryDeps {
  url: string
  logger: Logger
}
