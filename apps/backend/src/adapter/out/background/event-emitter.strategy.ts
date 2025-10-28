// standard
import { randomUUID } from 'node:crypto'

// c3
import { isErr, isNone, isSome, val } from '@c3-oss/functional'

// internal
import { BaseAdapter } from '~adapter/shared/base-adapter.js'
import type { BackgroundProcessingPort, IngestJob } from '~application/port/background-processing.port.js'
import { eventBus } from '~infra/events/event-bus.js'
import { handleFailure } from './ingestion/failure.js'
import { removeTempFile } from './ingestion/fs.js'
import { hasCompleted } from './ingestion/progression.js'
import { performContentIndexing } from './ingestion/steps/content-indexing.js'
import { performFileReference } from './ingestion/steps/file-reference.js'
import { finalizeSuccess } from './ingestion/steps/finalize-success.js'
import { markProcessing } from './ingestion/steps/mark-processing.js'
import { performStorageUpload } from './ingestion/steps/storage-upload.js'
import type { SagaDependencies } from './ingestion/types.js'
import type { IngestEventPayload } from './ingestion/types.js'

// ---------------------------------------------------------------------------------------------------------------------

export class EventEmitterBackgroundStrategy extends BaseAdapter implements BackgroundProcessingPort {
  private readonly deps: SagaDependencies

  public constructor(deps: SagaDependencies) {
    super()

    this.invariant(deps)
    this.deps = {
      ...deps,
      logger: deps.logger.child({ layer: 'background', module: 'document-ingestion' }),
    }

    eventBus.on('ingest-pdf', async (payload: IngestEventPayload) => {
      try {
        await this.processUpload(payload.uploadId)
      } catch (error) {
        this.deps.logger.error({ uploadId: payload.uploadId, error }, 'ingestion job failed unexpectedly')
      }
    })
  }

  public async enqueuePdfIngestion(job: IngestJob): Promise<void> {
    const recordResult = await this.deps.uploads.create({
      jobIdExt: randomUUID().replace(/-/g, ''),
      documentId: job.documentId,
      documentIdExt: job.documentIdExt,
      workspaceId: job.workspaceId,
      workspaceIdExt: job.workspaceIdExt,
      filename: job.filename,
      contentType: job.contentType,
      tempFilePath: job.filePath,
      status: 'queued',
      currentStep: 'pending',
      retryCount: 0,
    })

    if (isErr(recordResult)) {
      throw recordResult.left
    }

    const record = val(recordResult)
    this.deps.logger.info(
      { jobId: record.jobIdExt, documentId: job.documentId, documentIdExt: job.documentIdExt },
      'queued ingestion job',
    )

    eventBus.emit('ingest-pdf', { uploadId: record.id } satisfies IngestEventPayload)
  }

  private async processUpload(uploadId: number): Promise<void> {
    const uploadResult = await this.deps.uploads.getById(uploadId)
    if (isErr(uploadResult)) {
      this.deps.logger.error({ uploadId, error: uploadResult.left }, 'failed to load ingestion job')
      return
    }

    const uploadOption = val(uploadResult)
    if (isNone(uploadOption)) {
      this.deps.logger.warn({ uploadId }, 'ingestion job not found')
      return
    }

    let state = uploadOption.value
    if (state.status === 'completed') {
      this.deps.logger.debug({ uploadId, jobId: state.jobIdExt }, 'ingestion job already completed')
      await removeTempFile(state.tempFilePath, this.deps.logger)
      return
    }

    if (state.status === 'failed') {
      this.deps.logger.warn({ uploadId, jobId: state.jobIdExt }, 'skipping failed ingestion job')
      await removeTempFile(state.tempFilePath, this.deps.logger)
      return
    }

    const marked = await markProcessing(state, this.deps)

    if (isErr(marked)) {
      await handleFailure(state, marked.left, this.deps)
      await removeTempFile(state.tempFilePath, this.deps.logger)
      return
    }

    state = val(marked)

    const steps = [
      {
        key: 'storage_upload',
        run: (current: typeof state) => performStorageUpload(current, this.deps),
      },
      {
        key: 'file_reference',
        run: (current: typeof state) => performFileReference(current, this.deps),
      },
      {
        key: 'content_indexed',
        run: (current: typeof state) => performContentIndexing(current, this.deps),
      },
    ] as const

    for (const step of steps) {
      if (hasCompleted(state, step.key)) {
        continue
      }

      const result = await step.run(state)
      if (isErr(result)) {
        await handleFailure(state, result.left, this.deps)
        await removeTempFile(state.tempFilePath, this.deps.logger)
        return
      }
      state = val(result)
    }

    const finalized = await finalizeSuccess(state, this.deps)
    if (isSome(finalized)) {
      await handleFailure(state, finalized.value, this.deps)
    }
    await removeTempFile(state.tempFilePath, this.deps.logger)
  }
}
