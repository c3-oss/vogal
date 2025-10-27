import fs from 'node:fs/promises'
import { none, ok, some } from '@c3-oss/functional'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { eventBus } from '~infra/events/event-bus.js'
import { createMockLogger } from '~test/helpers/mock-logger.js'
import { EventEmitterBackgroundStrategy } from '../event-emitter.strategy.js'

const baseJob = {
  workspaceId: 1,
  workspaceIdExt: 'ws-1',
  documentId: 10,
  documentIdExt: 'doc-ext',
  filename: 'file.pdf',
  contentType: 'application/pdf',
  filePath: '/tmp/x.pdf',
}

const createStrategy = (
  overrides: {
    uploads?: Partial<ReturnType<typeof createUploadsRepoMock>>
    writer?: Record<string, any>
    storage?: Record<string, any>
    processor?: Record<string, any>
    vectorRepository?: Record<string, any>
  } = {},
) => {
  const uploads = { ...createUploadsRepoMock(), ...(overrides.uploads ?? {}) }
  const writer = {
    updateDocument: vi.fn(async () => ok(some({} as any))),
    attachFileReference: vi.fn(async () => none),
    deleteFileReference: vi.fn(async () => none),
    deleteMetadata: vi.fn(async () => none),
    deletePages: vi.fn(async () => none),
    ...(overrides.writer ?? {}),
  }
  const storage = {
    upload: vi.fn(async () => ok({ provider: 's3', bucket: 'b', objectKey: 'o' })),
    remove: vi.fn(async () => ok(undefined)),
    ...(overrides.storage ?? {}),
  }
  const processor = {
    execute: vi.fn(async () => none),
    ...(overrides.processor ?? {}),
  }
  const vectorRepository = {
    deleteDocumentVectors: vi.fn(async () => none),
    ...(overrides.vectorRepository ?? {}),
  }

  const strategy = new EventEmitterBackgroundStrategy({
    uploads: uploads as any,
    writer: writer as any,
    storage: storage as any,
    processor: processor as any,
    vectorRepository: vectorRepository as any,
    parsePdf: vi.fn(async () => ({ pages: [], totalPages: 0, metadata: {} })),
    chunkText: vi.fn(() => []),
    chunkSize: 100,
    chunkOverlap: 20,
    logger: createMockLogger(),
  })

  return { strategy, uploads, writer, storage, processor, vectorRepository }
}

function createUploadsRepoMock() {
  return {
    create: vi.fn(async (row: any) => ok({ id: 123, jobIdExt: 'job-1', retryCount: 0, ...row })),
    getById: vi.fn(async () => ok(none)),
    updateById: vi.fn(async () => ok(undefined)),
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  eventBus.removeAllListeners('ingest-pdf')
})

describe('EventEmitterBackgroundStrategy', () => {
  it('enqueuePdfIngestion persists job and emits event', async () => {
    const uploads = createUploadsRepoMock()
    const strategy = createStrategy({ uploads }).strategy

    const payloadPromise = new Promise<any>((resolve) => {
      eventBus.once('ingest-pdf', resolve)
    })

    await strategy.enqueuePdfIngestion(baseJob)
    const payload = await payloadPromise

    expect(uploads.create).toHaveBeenCalledWith(
      expect.objectContaining({
        jobIdExt: expect.any(String),
        documentId: baseJob.documentId,
        documentIdExt: baseJob.documentIdExt,
        workspaceId: baseJob.workspaceId,
        workspaceIdExt: baseJob.workspaceIdExt,
        filename: baseJob.filename,
        contentType: baseJob.contentType,
        tempFilePath: baseJob.filePath,
        status: 'queued',
      }),
    )
    expect(payload.uploadId).toBe(123)
  })

  it('processing short-circuits for completed jobs and removes temp file', async () => {
    const unlinkSpy = vi.spyOn(fs, 'unlink').mockResolvedValue(undefined as any)

    const uploads = createUploadsRepoMock()
    uploads.getById.mockResolvedValueOnce(
      ok(
        some({
          id: 55,
          jobIdExt: 'job-55',
          documentId: baseJob.documentId,
          documentIdExt: baseJob.documentIdExt,
          workspaceId: baseJob.workspaceId,
          workspaceIdExt: baseJob.workspaceIdExt,
          filename: baseJob.filename,
          contentType: baseJob.contentType,
          tempFilePath: baseJob.filePath,
          status: 'completed',
          currentStep: 'finalized',
          lastCompletedStep: 'finalized',
          retryCount: 0,
          errorMessage: null,
          storageProvider: 's3',
          storageBucket: 'bucket',
          storageObjectKey: 'key',
        }),
      ) as any,
    )

    const { strategy, storage } = createStrategy({ uploads })

    await strategy.enqueuePdfIngestion(baseJob)
    await new Promise((resolve) => setImmediate(resolve))

    expect(storage.upload).not.toHaveBeenCalled()
    expect(uploads.updateById).not.toHaveBeenCalled()
    expect(unlinkSpy).toHaveBeenCalledWith(baseJob.filePath)
  })

  it('processes the ingestion steps and finalizes the job', async () => {
    const uploads = createUploadsRepoMock()
    const uploadState = {
      id: 77,
      jobIdExt: 'job-77',
      documentId: baseJob.documentId,
      documentIdExt: baseJob.documentIdExt,
      workspaceId: baseJob.workspaceId,
      workspaceIdExt: baseJob.workspaceIdExt,
      filename: baseJob.filename,
      contentType: baseJob.contentType,
      tempFilePath: baseJob.filePath,
      status: 'queued' as const,
      currentStep: 'pending' as const,
      lastCompletedStep: null,
      retryCount: 0,
      errorMessage: null,
      storageProvider: null,
      storageBucket: null,
      storageObjectKey: null,
      startedAt: null,
      finishedAt: null,
      heartbeatAt: null,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      documentStatus: 'pending' as const,
      documentFailureReason: null,
    }

    uploads.getById.mockResolvedValueOnce(ok(some(uploadState)) as any)

    const fsUnlink = vi.spyOn(fs, 'unlink').mockResolvedValue(undefined as any)

    const { strategy, storage, writer, processor } = createStrategy({ uploads })

    await strategy.enqueuePdfIngestion(baseJob)
    await new Promise((resolve) => setImmediate(resolve))

    expect(uploads.updateById).toHaveBeenCalledWith(77, expect.objectContaining({ status: 'processing' }))
    expect(storage.upload).toHaveBeenCalledWith(
      expect.objectContaining({ documentIdExt: baseJob.documentIdExt, filename: baseJob.filename }),
    )
    expect(writer.attachFileReference).toHaveBeenCalledWith(
      expect.objectContaining({ documentId: baseJob.documentId, provider: 's3' }),
    )
    expect(processor.execute).toHaveBeenCalledWith(
      expect.objectContaining({ documentId: baseJob.documentId, documentIdExt: baseJob.documentIdExt }),
    )
    expect(writer.updateDocument).toHaveBeenCalledWith(baseJob.documentIdExt, {
      status: 'ready',
      failureReason: null,
    })
    expect(storage.remove).not.toHaveBeenCalled()
    expect(fsUnlink).toHaveBeenCalledWith(baseJob.filePath)
  })

  it('runs compensations when content indexing fails', async () => {
    const uploads = createUploadsRepoMock()
    const uploadState = {
      id: 88,
      jobIdExt: 'job-88',
      documentId: baseJob.documentId,
      documentIdExt: baseJob.documentIdExt,
      workspaceId: baseJob.workspaceId,
      workspaceIdExt: baseJob.workspaceIdExt,
      filename: baseJob.filename,
      contentType: baseJob.contentType,
      tempFilePath: baseJob.filePath,
      status: 'queued' as const,
      currentStep: 'pending' as const,
      lastCompletedStep: null,
      retryCount: 0,
      errorMessage: null,
      storageProvider: null,
      storageBucket: null,
      storageObjectKey: null,
      startedAt: null,
      finishedAt: null,
      heartbeatAt: null,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      documentStatus: 'pending' as const,
      documentFailureReason: null,
    }

    uploads.getById.mockResolvedValueOnce(ok(some(uploadState)) as any)

    const fsUnlink = vi.spyOn(fs, 'unlink').mockResolvedValue(undefined as any)

    const storage = {
      upload: vi.fn(async () => ok({ provider: 's3', bucket: 'bucket', objectKey: 'object-key' })),
      remove: vi.fn(async () => ok(undefined)),
    }
    const writer = {
      updateDocument: vi.fn(async () => ok(some({} as any))),
      attachFileReference: vi.fn(async () => none),
      deleteFileReference: vi.fn(async () => none),
      deleteMetadata: vi.fn(async () => none),
      deletePages: vi.fn(async () => none),
    }
    const vectorRepository = { deleteDocumentVectors: vi.fn(async () => none) }
    const processor = { execute: vi.fn(async () => some(new Error('processor boom'))) }

    const strategy = new EventEmitterBackgroundStrategy({
      uploads: uploads as any,
      writer: writer as any,
      storage: storage as any,
      processor: processor as any,
      vectorRepository: vectorRepository as any,
      parsePdf: vi.fn(async () => ({ pages: [], totalPages: 0, metadata: {} })),
      chunkText: vi.fn(() => []),
      chunkSize: 100,
      chunkOverlap: 10,
      logger: createMockLogger(),
    })

    await strategy.enqueuePdfIngestion(baseJob)
    await new Promise((resolve) => setImmediate(resolve))

    expect(writer.deleteMetadata).toHaveBeenCalledWith(baseJob.documentId)
    expect(writer.deletePages).toHaveBeenCalledWith(baseJob.documentId)
    expect(writer.deleteFileReference).toHaveBeenCalledWith(baseJob.documentId)
    expect(vectorRepository.deleteDocumentVectors).toHaveBeenCalledWith(baseJob.documentIdExt, baseJob.workspaceIdExt)
    expect(storage.remove).toHaveBeenCalledWith({ bucket: 'bucket', objectKey: 'object-key' })
    expect(writer.updateDocument).toHaveBeenCalledWith(baseJob.documentIdExt, {
      status: 'failed',
      failureReason: 'processor boom',
    })
    expect(uploads.updateById).toHaveBeenCalledWith(
      88,
      expect.objectContaining({ status: 'failed', errorMessage: 'processor boom' }),
    )
    expect(fsUnlink).toHaveBeenCalledWith(baseJob.filePath)
  })
})
