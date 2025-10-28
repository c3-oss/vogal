// 3rd-party
import { createHash } from 'node:crypto'
import { type RedisClientType, createClient } from 'redis'
import '@redis/json'
import stringify from 'safe-stable-stringify'

// c3
import type { Logger } from '@c3-oss/logger'
import type { Nullable } from '@c3-oss/types'

// internal
import { BaseAdapter } from '~adapter/shared/base-adapter.js'
import type { CacheFactoryDeps, CachePort } from '~port/cache.port.js'

// ---------------------------------------------------------------------------------------------------------------------

export class RedisCacheAdapter extends BaseAdapter implements CachePort {
  private readonly log: Logger
  private readonly client: RedisClientType
  private get json() {
    return (
      this.client as unknown as {
        json: {
          get: (key: string) => Promise<unknown>
          set: (key: string, path: string, value: unknown) => Promise<unknown>
        }
      }
    ).json
  }

  public constructor(deps: CacheFactoryDeps) {
    super()
    this.invariant(deps)
    this.log = deps.logger
    this.client = createClient({ url: deps.url })

    this.client.on('error', (err) => this.log.error({ err }, 'Redis client error'))
    this.client.on('connect', () => this.log.info('Redis client connected'))
    this.client.on('end', () => this.log.info('Redis client disconnected'))
  }

  public async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect()
    }
  }

  public async getJSON<T>(key: string): Promise<Nullable<T>> {
    try {
      const value = await this.json.get(key)
      return (value as T | null) ?? null
    } catch (err) {
      this.log.warn({ err, key }, 'Redis JSON.GET failed')
      return null
    }
  }

  public async setJSON<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.json.set(key, '$', value as unknown)
      if (ttlSeconds > 0) {
        await this.client.expire(key, ttlSeconds)
      }
    } catch (err) {
      this.log.warn({ err, key }, 'Redis JSON.SET failed')
    }
  }

  public async expire(key: string, ttlSeconds: number): Promise<void> {
    try {
      await this.client.expire(key, ttlSeconds)
    } catch (err) {
      this.log.warn({ err, key }, 'Redis EXPIRE failed')
    }
  }

  public async del(key: string): Promise<void> {
    try {
      await this.client.del(key)
    } catch (err) {
      this.log.warn({ err, key }, 'Redis DEL failed')
    }
  }

  public async delByPattern(pattern: string): Promise<number> {
    let deleted = 0
    try {
      for await (const key of this.client.scanIterator({ MATCH: pattern, COUNT: 1000 })) {
        await this.client.del(String(key))
        deleted++
      }
    } catch (err) {
      this.log.warn({ err, pattern }, 'Redis SCAN/DEL failed')
    }
    return deleted
  }

  public async close(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit()
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------------

export const stableStringify = (input: unknown): string => stringify(input) ?? 'null'

export const sha1 = (input: string): string => createHash('sha1').update(input).digest('hex')
