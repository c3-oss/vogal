// 3rd-party
import { describe, expect, it, vi } from 'vitest'

// c3
import { type Option, isNone, isSome, none, ok, some } from '@c3-oss/functional'

// internal
import { createMockLogger } from '~test/helpers/mock-logger.js'

// internal
import { type ProcessPdfDeps, ProcessPdfUseCase } from '../process-pdf.js'

// ---------------------------------------------------------------------------------------------------------------------

const createDeps = (): ProcessPdfDeps & {
  repository: ProcessPdfDeps['repository'] & { upsert: ReturnType<typeof vi.fn> }
  writer: ProcessPdfDeps['writer'] & {
    insertPages: ReturnType<typeof vi.fn>
    upsertMetadata: ReturnType<typeof vi.fn>
    runInTransactionSpy: ReturnType<typeof vi.fn>
  }
} => {
  const embedMany = vi.fn(async () =>
    ok([
      [1, 2, 3],
      [4, 5, 6],
    ]),
  )
  const repoUpsert = vi.fn(async () => none as Option<Error>)
  const repoDeleteVectors = vi.fn(async () => none as Option<Error>)
  const writerInsertPages = vi.fn(async () => none as Option<Error>)
  const writerUpsertMetadata = vi.fn(async () => none as Option<Error>)
  const writerAttachFileReference = vi.fn(async () => none as Option<Error>)

  const repository = {
    initCollection: vi.fn(async () => none as Option<Error>),
    deleteCollection: vi.fn(async () => none as Option<Error>),
    upsert: repoUpsert,
    deleteDocumentVectors: repoDeleteVectors,
    search: vi.fn(async () => ok([])),
    listDocuments: vi.fn(async () =>
      ok({
        meta: {
          totalResults: 0,
          totalPages: 0,
          currentPage: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        items: [],
      }),
    ),
  } as ProcessPdfDeps['repository'] & { upsert: typeof repoUpsert }

  type WriterMock = ProcessPdfDeps['writer'] & {
    insertPages: typeof writerInsertPages
    upsertMetadata: typeof writerUpsertMetadata
    attachFileReference: typeof writerAttachFileReference
    runInTransactionSpy: ReturnType<typeof vi.fn>
  }

  const writer = {} as WriterMock
  writer.createDocument = vi.fn()
  writer.insertPages = writerInsertPages
  writer.upsertMetadata = writerUpsertMetadata
  writer.attachFileReference = writerAttachFileReference

  const runInTransactionSpy = vi.fn(async (operation: (unit: ProcessPdfDeps['writer']) => Promise<unknown>) => {
    return await operation(writer)
  })

  writer.runInTransaction = async <T>(operation: (unit: ProcessPdfDeps['writer']) => Promise<T>): Promise<T> => {
    return (await runInTransactionSpy(operation)) as T
  }
  writer.runInTransactionSpy = runInTransactionSpy

  const deps: ProcessPdfDeps = {
    embedder: { embedMany } as ProcessPdfDeps['embedder'],
    repository,
    normalizer: {
      normalize: vi.fn(async (t: string) => ok(t)),
    } as ProcessPdfDeps['normalizer'],
    writer,
    logger: createMockLogger(),
  }

  return { ...deps, repository, writer }
}

describe('ProcessPdfUseCase', () => {
  it('should normalize, chunk, embed and upsert points and metadata', async () => {
    const deps = createDeps()
    const useCase = new ProcessPdfUseCase(deps)

    const chunkText = (text: string) => [text, `${text}-2`]

    const result = await useCase.execute({
      documentId: 1,
      documentIdExt: 'ext-1',
      filename: 'file.pdf',
      contentType: 'application/pdf',
      pages: [
        { pageNumber: 1, text: 'hello' },
        { pageNumber: 2, text: 'world' },
      ],
      totalPages: 2,
      metadata: { title: 't', author: 'a' },
      chunkSize: 100,
      chunkOverlap: 10,
      chunkText,
      workspaceIdExt: 'ws-1',
    })

    expect(isNone(result)).toBe(true)
    expect(deps.writer.insertPages).toHaveBeenCalled()
    expect(deps.writer.upsertMetadata).toHaveBeenCalledWith([
      { documentId: 1, key: 'title', value: 't' },
      { documentId: 1, key: 'author', value: 'a' },
    ])
    expect(deps.repository.upsert).toHaveBeenCalled()
    expect(deps.writer.runInTransactionSpy).toHaveBeenCalled()
  })

  it('should bubble up failures from writer insert pages', async () => {
    const deps = createDeps()
    deps.writer.insertPages.mockResolvedValueOnce(some(new Error('insert failure')))
    const useCase = new ProcessPdfUseCase(deps)

    const result = await useCase.execute({
      documentId: 1,
      documentIdExt: 'ext-1',
      filename: 'file.pdf',
      contentType: 'application/pdf',
      pages: [{ pageNumber: 1, text: 'hello' }],
      totalPages: 1,
      metadata: {},
      chunkSize: 100,
      chunkOverlap: 10,
      chunkText: (text: string) => [text],
      workspaceIdExt: 'ws-1',
    })

    expect(isSome(result)).toBe(true)
    if (isSome(result)) {
      expect(result.value).toBeInstanceOf(Error)
      expect(result.value.message).toBe('insert failure')
    }
    expect(deps.writer.runInTransactionSpy).toHaveBeenCalled()
  })

  it('should bubble up failures from repository upsert', async () => {
    const deps = createDeps()
    deps.repository.upsert.mockResolvedValueOnce(some(new Error('upsert failure')))
    const useCase = new ProcessPdfUseCase(deps)

    const result = await useCase.execute({
      documentId: 1,
      documentIdExt: 'ext-1',
      filename: 'file.pdf',
      contentType: 'application/pdf',
      pages: [{ pageNumber: 1, text: 'hello' }],
      totalPages: 1,
      metadata: {},
      chunkSize: 100,
      chunkOverlap: 10,
      chunkText: (text: string) => [text],
      workspaceIdExt: 'ws-1',
    })

    expect(isSome(result)).toBe(true)
    if (isSome(result)) {
      expect(result.value).toBeInstanceOf(Error)
      expect(result.value.message).toBe('upsert failure')
    }
    expect(deps.writer.runInTransactionSpy).toHaveBeenCalled()
  })
})
