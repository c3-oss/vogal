// 3rd-party
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest'

// internal
import { RedisCacheAdapter, sha1, stableStringify } from '../redis.cache.adapter.js'

// Mock redis module
vi.mock('redis', () => {
  const mockClient = {
    isOpen: false,
    connect: vi.fn(),
    quit: vi.fn(),
    expire: vi.fn(),
    del: vi.fn(),
    scanIterator: vi.fn(),
    on: vi.fn(),
    json: {
      get: vi.fn(),
      set: vi.fn(),
    },
  }

  return {
    createClient: vi.fn(() => mockClient),
  }
})

describe('RedisCacheAdapter', () => {
  let mockLogger: any
  let mockClient: any

  beforeEach(async () => {
    mockLogger = {
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    }

    // Get the mocked client
    const { createClient } = await import('redis')
    mockClient = (createClient as Mock)()

    // Reset all mocks
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('should create a Redis client with correct URL', async () => {
      const { createClient } = await import('redis')
      new RedisCacheAdapter({ logger: mockLogger, url: 'redis://localhost:6379' })
      expect(createClient).toHaveBeenCalledWith({ url: 'redis://localhost:6379' })
    })

    it('should register event handlers', async () => {
      new RedisCacheAdapter({ logger: mockLogger, url: 'redis://localhost' })
      expect(mockClient.on).toHaveBeenCalledWith('error', expect.any(Function))
      expect(mockClient.on).toHaveBeenCalledWith('connect', expect.any(Function))
      expect(mockClient.on).toHaveBeenCalledWith('end', expect.any(Function))
    })
  })

  describe('connect', () => {
    it('should connect when client is not open', async () => {
      mockClient.isOpen = false
      const adapter = new RedisCacheAdapter({ logger: mockLogger, url: 'redis://localhost' })
      await adapter.connect()
      expect(mockClient.connect).toHaveBeenCalled()
    })

    it('should not connect when client is already open', async () => {
      mockClient.isOpen = true
      const adapter = new RedisCacheAdapter({ logger: mockLogger, url: 'redis://localhost' })
      await adapter.connect()
      expect(mockClient.connect).not.toHaveBeenCalled()
    })
  })

  describe('getJSON', () => {
    it('should return parsed JSON value', async () => {
      const testData = { foo: 'bar' }
      mockClient.json.get.mockResolvedValue(testData)

      const adapter = new RedisCacheAdapter({ logger: mockLogger, url: 'redis://localhost' })
      const result = await adapter.getJSON('test-key')

      expect(mockClient.json.get).toHaveBeenCalledWith('test-key')
      expect(result).toEqual(testData)
    })

    it('should return null when value is not found', async () => {
      mockClient.json.get.mockResolvedValue(null)

      const adapter = new RedisCacheAdapter({ logger: mockLogger, url: 'redis://localhost' })
      const result = await adapter.getJSON('missing-key')

      expect(result).toBeNull()
    })

    it('should return null and log warning on error', async () => {
      mockClient.json.get.mockRejectedValue(new Error('Redis error'))

      const adapter = new RedisCacheAdapter({ logger: mockLogger, url: 'redis://localhost' })
      const result = await adapter.getJSON('error-key')

      expect(result).toBeNull()
      expect(mockLogger.warn).toHaveBeenCalledWith(
        { err: expect.any(Error), key: 'error-key' },
        'Redis JSON.GET failed',
      )
    })
  })

  describe('setJSON', () => {
    it('should set JSON value without TTL when ttl is 0', async () => {
      const testData = { foo: 'bar' }
      mockClient.json.set.mockResolvedValue('OK')

      const adapter = new RedisCacheAdapter({ logger: mockLogger, url: 'redis://localhost' })
      await adapter.setJSON('test-key', testData, 0)

      expect(mockClient.json.set).toHaveBeenCalledWith('test-key', '$', testData)
      expect(mockClient.expire).not.toHaveBeenCalled()
    })

    it('should set JSON value with TTL when ttl > 0', async () => {
      const testData = { foo: 'bar' }
      mockClient.json.set.mockResolvedValue('OK')
      mockClient.expire.mockResolvedValue(true)

      const adapter = new RedisCacheAdapter({ logger: mockLogger, url: 'redis://localhost' })
      await adapter.setJSON('test-key', testData, 300)

      expect(mockClient.json.set).toHaveBeenCalledWith('test-key', '$', testData)
      expect(mockClient.expire).toHaveBeenCalledWith('test-key', 300)
    })

    it('should log warning on set error', async () => {
      mockClient.json.set.mockRejectedValue(new Error('Redis error'))

      const adapter = new RedisCacheAdapter({ logger: mockLogger, url: 'redis://localhost' })
      await adapter.setJSON('error-key', { foo: 'bar' }, 60)

      expect(mockLogger.warn).toHaveBeenCalledWith(
        { err: expect.any(Error), key: 'error-key' },
        'Redis JSON.SET failed',
      )
    })

    it('should log warning on expire error', async () => {
      mockClient.json.set.mockResolvedValue('OK')
      mockClient.expire.mockRejectedValue(new Error('Redis error'))

      const adapter = new RedisCacheAdapter({ logger: mockLogger, url: 'redis://localhost' })
      await adapter.setJSON('error-key', { foo: 'bar' }, 60)

      expect(mockLogger.warn).toHaveBeenCalledWith(
        { err: expect.any(Error), key: 'error-key' },
        'Redis JSON.SET failed',
      )
    })
  })

  describe('expire', () => {
    it('should set expiration on key', async () => {
      mockClient.expire.mockResolvedValue(true)

      const adapter = new RedisCacheAdapter({ logger: mockLogger, url: 'redis://localhost' })
      await adapter.expire('test-key', 120)

      expect(mockClient.expire).toHaveBeenCalledWith('test-key', 120)
    })

    it('should log warning on expire error', async () => {
      mockClient.expire.mockRejectedValue(new Error('Redis error'))

      const adapter = new RedisCacheAdapter({ logger: mockLogger, url: 'redis://localhost' })
      await adapter.expire('error-key', 60)

      expect(mockLogger.warn).toHaveBeenCalledWith({ err: expect.any(Error), key: 'error-key' }, 'Redis EXPIRE failed')
    })
  })

  describe('del', () => {
    it('should delete key', async () => {
      mockClient.del.mockResolvedValue(1)

      const adapter = new RedisCacheAdapter({ logger: mockLogger, url: 'redis://localhost' })
      await adapter.del('test-key')

      expect(mockClient.del).toHaveBeenCalledWith('test-key')
    })

    it('should log warning on delete error', async () => {
      mockClient.del.mockRejectedValue(new Error('Redis error'))

      const adapter = new RedisCacheAdapter({ logger: mockLogger, url: 'redis://localhost' })
      await adapter.del('error-key')

      expect(mockLogger.warn).toHaveBeenCalledWith({ err: expect.any(Error), key: 'error-key' }, 'Redis DEL failed')
    })
  })

  describe('delByPattern', () => {
    it('should delete keys when scanIterator yields batches (node-redis v5)', async () => {
      mockClient.scanIterator.mockReturnValue({
        async *[Symbol.asyncIterator]() {
          yield ['key1', 'key2']
          yield ['key3']
        },
      })
      mockClient.del.mockResolvedValue(1)

      const adapter = new RedisCacheAdapter({ logger: mockLogger, url: 'redis://localhost' })
      const deleted = await adapter.delByPattern('test:*')

      expect(mockClient.scanIterator).toHaveBeenCalledWith({ MATCH: 'test:*', COUNT: 1000 })
      expect(mockClient.del).toHaveBeenNthCalledWith(1, ['key1', 'key2'])
      expect(mockClient.del).toHaveBeenNthCalledWith(2, ['key3'])
      expect(deleted).toBe(3)
    })

    it('should delete keys when scanIterator yields single strings (node-redis v4)', async () => {
      const mockKeys = ['key1', 'key2', 'key3']
      mockClient.scanIterator.mockReturnValue({
        async *[Symbol.asyncIterator]() {
          for (const key of mockKeys) {
            yield key
          }
        },
      })
      mockClient.del.mockResolvedValue(1)

      const adapter = new RedisCacheAdapter({ logger: mockLogger, url: 'redis://localhost' })
      const deleted = await adapter.delByPattern('test:*')

      expect(mockClient.del).toHaveBeenCalledTimes(3)
      expect(deleted).toBe(3)
    })

    it('should skip empty batches without calling del', async () => {
      mockClient.scanIterator.mockReturnValue({
        async *[Symbol.asyncIterator]() {
          yield []
          yield ['key1']
        },
      })
      mockClient.del.mockResolvedValue(1)

      const adapter = new RedisCacheAdapter({ logger: mockLogger, url: 'redis://localhost' })
      const deleted = await adapter.delByPattern('test:*')

      expect(mockClient.del).toHaveBeenCalledTimes(1)
      expect(mockClient.del).toHaveBeenCalledWith(['key1'])
      expect(deleted).toBe(1)
    })

    it('should return 0 when no keys match pattern', async () => {
      mockClient.scanIterator.mockReturnValue({
        async *[Symbol.asyncIterator]() {},
      })

      const adapter = new RedisCacheAdapter({ logger: mockLogger, url: 'redis://localhost' })
      const deleted = await adapter.delByPattern('nonexistent:*')

      expect(deleted).toBe(0)
    })

    it('should log warning and return count on scan error', async () => {
      mockClient.scanIterator.mockImplementation(() => {
        throw new Error('Scan error')
      })

      const adapter = new RedisCacheAdapter({ logger: mockLogger, url: 'redis://localhost' })
      const deleted = await adapter.delByPattern('error:*')

      expect(mockLogger.warn).toHaveBeenCalledWith(
        { err: expect.any(Error), pattern: 'error:*' },
        'Redis SCAN/DEL failed',
      )
      expect(deleted).toBe(0)
    })
  })

  describe('close', () => {
    it('should quit when client is open', async () => {
      mockClient.isOpen = true
      mockClient.quit.mockResolvedValue('OK')

      const adapter = new RedisCacheAdapter({ logger: mockLogger, url: 'redis://localhost' })
      await adapter.close()

      expect(mockClient.quit).toHaveBeenCalled()
    })

    it('should not quit when client is not open', async () => {
      mockClient.isOpen = false

      const adapter = new RedisCacheAdapter({ logger: mockLogger, url: 'redis://localhost' })
      await adapter.close()

      expect(mockClient.quit).not.toHaveBeenCalled()
    })
  })
})

describe('Helper functions', () => {
  describe('stableStringify', () => {
    it('should stringify object deterministically', () => {
      const obj = { b: 2, a: 1 }
      const result = stableStringify(obj)
      expect(result).toBe('{"a":1,"b":2}')
    })

    it('should handle null', () => {
      const result = stableStringify(null)
      expect(result).toBe('null')
    })

    it('should handle undefined', () => {
      const result = stableStringify(undefined)
      expect(result).toBe('null')
    })
  })

  describe('sha1', () => {
    it('should generate consistent hash', () => {
      const hash1 = sha1('test')
      const hash2 = sha1('test')
      expect(hash1).toBe(hash2)
    })

    it('should generate different hashes for different inputs', () => {
      const hash1 = sha1('test1')
      const hash2 = sha1('test2')
      expect(hash1).not.toBe(hash2)
    })

    it('should generate 40-character hexadecimal hash', () => {
      const hash = sha1('test')
      expect(hash).toMatch(/^[a-f0-9]{40}$/)
    })
  })
})
