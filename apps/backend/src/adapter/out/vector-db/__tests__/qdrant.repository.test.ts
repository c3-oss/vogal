// 3rd-party
import { beforeEach, describe, expect, it, vi } from 'vitest'

// workspace
import { isErr, isLeft, isNone, isOk, isSome } from '@c3-oss/functional'

// internal
import { QdrantRepository } from '../qdrant.repository.js'

// ---------------------------------------------------------------------------------------------------------------------

const methods = {
  getCollection: vi.fn(),
  createCollection: vi.fn(),
  deleteCollection: vi.fn(),
  upsert: vi.fn(),
  search: vi.fn(),
  scroll: vi.fn(),
}

vi.mock('@qdrant/js-client-rest', () => ({ QdrantClient: vi.fn(() => methods) }))

const mocked = () => methods

describe('QdrantRepository', () => {
  beforeEach(() => {
    const m = mocked()
    m.getCollection.mockReset()
    m.createCollection.mockReset()
    m.deleteCollection.mockReset()
    m.upsert.mockReset()
    m.search.mockReset()
    m.scroll.mockReset()
  })

  it('initCollection returns none when exists', async () => {
    const repo = new QdrantRepository()
    mocked().getCollection.mockResolvedValue({})
    const result = await repo.initCollection('c')
    // returns Option.none => check by absence of value
    expect(isNone(result)).toBe(true)
  })

  it('initCollection creates when missing, and returns error on failure', async () => {
    const repo = new QdrantRepository()
    mocked().getCollection.mockRejectedValue(new Error('missing'))
    mocked().createCollection.mockRejectedValue(new Error('create fail'))
    const result = await repo.initCollection('c')
    expect(isSome(result)).toBe(true)
  })

  it('deleteCollection returns none on success and some on error', async () => {
    const repo = new QdrantRepository()
    mocked().deleteCollection.mockResolvedValue({})
    expect(isNone(await repo.deleteCollection('c'))).toBe(true)
    mocked().deleteCollection.mockRejectedValue(new Error('x'))
    const errorResult = await repo.deleteCollection('c')
    expect(isSome(errorResult)).toBe(true)
    if (isSome(errorResult)) {
      expect(errorResult.value).toBeInstanceOf(Error)
    }
  })

  it('upsert returns none on success and some on error', async () => {
    const repo = new QdrantRepository()
    mocked().upsert.mockResolvedValue({})
    expect(isNone(await repo.upsert([], 'c'))).toBe(true)
    mocked().upsert.mockRejectedValue(new Error('x'))
    const errorResult = await repo.upsert([], 'c')
    expect(isSome(errorResult)).toBe(true)
    if (isSome(errorResult)) {
      expect(errorResult.value).toBeInstanceOf(Error)
    }
  })

  it('search maps results and supports filter', async () => {
    const repo = new QdrantRepository()
    mocked().search.mockResolvedValue([
      {
        score: 0.9,
        payload: { documentId: 'd', filename: 'f', pageNumber: 1, chunkIndex: 0, text: 't', totalPages: 2 },
      },
    ])
    const res = await repo.search([0, 1], 5, { documentId: 'd' } as any, 'c')
    expect(isOk(res) && Array.isArray((res as any).right)).toBe(true)
  })

  it('search returns err on client failure', async () => {
    const repo = new QdrantRepository()
    mocked().search.mockRejectedValue(new Error('x'))
    const res = await repo.search([0], 1, undefined as any, 'c')
    expect(isErr(res)).toBe(true)
  })

  it('listDocuments aggregates, sorts, paginates; and handles errors', async () => {
    const repo = new QdrantRepository()
    mocked().scroll.mockResolvedValue({
      points: [
        { payload: { documentId: 'a', filename: 'z', title: 'A', author: 'B', totalPages: 1 } },
        { payload: { documentId: 'a', filename: 'z', title: 'A', author: 'B', totalPages: 1 } },
        { payload: null },
        { payload: { documentId: 'b', filename: 'y', title: 'C', author: 'A', totalPages: 2 } },
      ],
    })

    const ok = await repo.listDocuments(
      { orderField: 'chunksCount', orderDirection: 'desc', limit: 1, page: 2 } as any,
      'c',
    )
    if (isOk(ok)) {
      expect((ok as any).right.meta.totalResults).toBe(2)
      expect((ok as any).right.meta.currentPage).toBe(2)
      expect((ok as any).right.items.length).toBe(1)
    } else {
      throw new Error('expected right')
    }

    mocked().scroll.mockRejectedValue(new Error('x'))
    const err = await repo.listDocuments(undefined as any, 'c')
    expect(isLeft(err)).toBe(true)
  })
})
