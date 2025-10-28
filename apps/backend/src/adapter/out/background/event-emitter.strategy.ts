// standard
import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'

// c3
import { type Failable, type Option, err, isErr, isNone, isSome, none, ok, some, val } from '@c3-oss/functional'
import type { Logger } from '@c3-oss/logger'
import type { Nullable } from '@c3-oss/types'

// internal
import { BaseAdapter } from '~adapter/shared/base-adapter.js'
import type {
  DocumentMetadataBasicInfoDTO,
  DocumentPageBasicInfoDTO,
  DocumentUploadDTO,
} from '~application/dto/index.js'
import type { BackgroundProcessingPort, IngestJob } from '~application/port/background-processing.port.js'
import type { StorageProvider, StorageProviderPort } from '~application/port/storage-provider.port.js'
import { VErrorInvalidState, VErrorUnknown } from '~infra/errors/index.js'
import { eventBus } from '~infra/events/event-bus.js'
import type { DocumentUploadRepository } from '~out/db/model/document-uploads/document-upload.repository.js'
import type { DocumentWriteAdapter } from '~out/db/model/document/document-write.adapter.js'
import type { VogalRepositoryPort } from '~port/vogal-repository.port.js'
import type { ProcessPdfUseCase } from '~usecase/document/process-pdf.js'

// ---------------------------------------------------------------------------------------------------------------------

type UploadStep = DocumentUploadDTO['currentStep']

const STEP_ORDER: readonly UploadStep[] = [
  'pending',
  'storage_upload',
  'file_reference',
  'content_indexed',
  'finalized',
]

interface SagaDependencies {
  uploads: DocumentUploadRepository
  writer: DocumentWriteAdapter
  storage: StorageProviderPort
  processor: ProcessPdfUseCase
  vectorRepository: VogalRepositoryPort
  parsePdf: (filePath: string) => Promise<{
    pages: DocumentPageBasicInfoDTO[]
    totalPages: number
    metadata: Partial<DocumentMetadataBasicInfoDTO>
  }>
  chunkText: (text: string, chunkSize: number, overlap: number) => string[]
  chunkSize: number
  chunkOverlap: number
  logger: Logger
}

interface IngestEventPayload {
  uploadId: number
}

// ---------------------------------------------------------------------------------------------------------------------

export class EventEmitterBackgroundStrategy extends BaseAdapter implements BackgroundProcessingPort {
  private readonly uploads: DocumentUploadRepository
  private readonly writer: DocumentWriteAdapter
  private readonly storage: StorageProviderPort
  private readonly processor: ProcessPdfUseCase
  private readonly vectorRepository: VogalRepositoryPort
  private readonly parsePdf: SagaDependencies['parsePdf']
  private readonly chunkText: SagaDependencies['chunkText']
  private readonly chunkSize: number
  private readonly chunkOverlap: number
  private readonly log: Logger

  public constructor(deps: SagaDependencies) {
    super()

    this.invariant(deps)

    this.uploads = deps.uploads
    this.writer = deps.writer
    this.storage = deps.storage
    this.processor = deps.processor
    this.vectorRepository = deps.vectorRepository
    this.parsePdf = deps.parsePdf
    this.chunkText = deps.chunkText
    this.chunkSize = deps.chunkSize
    this.chunkOverlap = deps.chunkOverlap
    this.log = deps.logger.child({ layer: 'background', module: 'document-ingestion' })

    eventBus.on('ingest-pdf', async (payload: IngestEventPayload) => {
      try {
        await this.processUpload(payload.uploadId)
      } catch (error) {
        this.log.error({ uploadId: payload.uploadId, error }, 'ingestion job failed unexpectedly')
      }
    })
  }

  public async enqueuePdfIngestion(job: IngestJob): Promise<void> {
    const recordResult = await this.uploads.create({
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
    this.log.info(
      { jobId: record.jobIdExt, documentId: job.documentId, documentIdExt: job.documentIdExt },
      'queued ingestion job',
    )

    eventBus.emit('ingest-pdf', { uploadId: record.id } satisfies IngestEventPayload)
  }

  private getStepIndex(step?: Nullable<UploadStep>): number {
    const target = step ?? 'pending'
    return STEP_ORDER.indexOf(target)
  }

  private hasCompleted(state: DocumentUploadDTO, step: UploadStep): boolean {
    return this.getStepIndex(state.lastCompletedStep) >= this.getStepIndex(step)
  }

  private getNextPendingStep(state: DocumentUploadDTO): UploadStep {
    for (const step of STEP_ORDER) {
      if (step === 'pending') {
        continue
      }
      if (!this.hasCompleted(state, step)) {
        return step
      }
    }
    return 'finalized'
  }

  private async processUpload(uploadId: number): Promise<void> {
    const uploadResult = await this.uploads.getById(uploadId)
    if (isErr(uploadResult)) {
      this.log.error({ uploadId, error: uploadResult.left }, 'failed to load ingestion job')
      return
    }

    const uploadOption = val(uploadResult)
    if (isNone(uploadOption)) {
      this.log.warn({ uploadId }, 'ingestion job not found')
      return
    }

    let state = uploadOption.value
    if (state.status === 'completed') {
      this.log.debug({ uploadId, jobId: state.jobIdExt }, 'ingestion job already completed')
      await this.removeTempFile(state.tempFilePath)
      return
    }

    if (state.status === 'failed') {
      this.log.warn({ uploadId, jobId: state.jobIdExt }, 'skipping failed ingestion job')
      await this.removeTempFile(state.tempFilePath)
      return
    }

    const marked = await this.markProcessing(state)

    if (isErr(marked)) {
      await this.handleFailure(state, marked.left)
      await this.removeTempFile(state.tempFilePath)
      return
    }

    state = val(marked)

    if (!this.hasCompleted(state, 'storage_upload')) {
      const r1 = await this.performStorageUpload(state)
      if (isErr(r1)) {
        await this.handleFailure(state, r1.left)
        await this.removeTempFile(state.tempFilePath)
        return
      }
      state = val(r1)
    }

    if (!this.hasCompleted(state, 'file_reference')) {
      const r2 = await this.performFileReference(state)
      if (isErr(r2)) {
        await this.handleFailure(state, r2.left)
        await this.removeTempFile(state.tempFilePath)
        return
      }
      state = val(r2)
    }

    if (!this.hasCompleted(state, 'content_indexed')) {
      const r3 = await this.performContentIndexing(state)
      if (isErr(r3)) {
        await this.handleFailure(state, r3.left)
        await this.removeTempFile(state.tempFilePath)
        return
      }
      state = val(r3)
    }

    const finalized = await this.finalizeSuccess(state)
    if (isSome(finalized)) {
      await this.handleFailure(state, finalized.value)
    }
    await this.removeTempFile(state.tempFilePath)
  }

  private async markProcessing(state: DocumentUploadDTO): Promise<Failable<DocumentUploadDTO>> {
    const now = new Date()
    const nextStep = this.getNextPendingStep(state)

    const uploadUpdate = await this.uploads.updateById(state.id, {
      status: 'processing',
      currentStep: nextStep,
      startedAt: state.startedAt ?? now,
      heartbeatAt: now,
      errorMessage: null,
    })

    if (isSome(uploadUpdate)) {
      return err(uploadUpdate.value)
    }

    const documentUpdate = await this.writer.updateDocument(state.documentIdExt, {
      status: 'processing',
      failureReason: null,
    })

    if (isErr(documentUpdate)) {
      return err(documentUpdate.left)
    }

    return ok({
      ...state,
      status: 'processing',
      currentStep: nextStep,
      startedAt: state.startedAt ?? now,
      heartbeatAt: now,
      errorMessage: null,
    })
  }

  private async performStorageUpload(state: DocumentUploadDTO): Promise<Failable<DocumentUploadDTO>> {
    this.log.debug({ jobId: state.jobIdExt, documentIdExt: state.documentIdExt }, 'step: uploading to remote storage')

    const uploadResult = await this.storage.upload({
      documentIdExt: state.documentIdExt,
      filename: state.filename,
      contentType: state.contentType,
      localFilePath: state.tempFilePath,
    })

    if (isErr(uploadResult)) {
      return err(uploadResult.left)
    }

    const remote = val(uploadResult)

    const updateResult = await this.uploads.updateById(state.id, {
      storageProvider: remote.provider,
      storageBucket: remote.bucket,
      storageObjectKey: remote.objectKey,
      lastCompletedStep: 'storage_upload',
      currentStep: 'file_reference',
      heartbeatAt: new Date(),
    })

    if (isSome(updateResult)) {
      await this.safeRemoveRemoteFile(remote.bucket, remote.objectKey)
      return err(updateResult.value)
    }

    return ok({
      ...state,
      storageProvider: remote.provider,
      storageBucket: remote.bucket,
      storageObjectKey: remote.objectKey,
      lastCompletedStep: 'storage_upload',
      currentStep: 'file_reference',
    })
  }

  private async performFileReference(state: DocumentUploadDTO): Promise<Failable<DocumentUploadDTO>> {
    if (!state.storageProvider || !state.storageBucket || !state.storageObjectKey) {
      return err(new VErrorInvalidState({ message: 'storage metadata missing for file reference step' }))
    }

    this.log.debug({ jobId: state.jobIdExt, documentIdExt: state.documentIdExt }, 'step: persisting file reference')

    const provider = state.storageProvider as StorageProvider

    const attachResult = await this.writer.attachFileReference({
      documentId: state.documentId,
      provider,
      bucket: state.storageBucket,
      objectKey: state.storageObjectKey,
      publicUrl: null,
    })

    if (isSome(attachResult)) {
      return err(attachResult.value)
    }

    const updateResult = await this.uploads.updateById(state.id, {
      lastCompletedStep: 'file_reference',
      currentStep: 'content_indexed',
      heartbeatAt: new Date(),
    })

    if (isSome(updateResult)) {
      await this.writer.deleteFileReference(state.documentId)
      return err(updateResult.value)
    }

    return ok({
      ...state,
      lastCompletedStep: 'file_reference',
      currentStep: 'content_indexed',
    })
  }

  private async performContentIndexing(state: DocumentUploadDTO): Promise<Failable<DocumentUploadDTO>> {
    this.log.info({ jobId: state.jobIdExt, documentIdExt: state.documentIdExt }, 'step: parsing and indexing content')

    const parsedDocument = await this.parsePdf(state.tempFilePath)

    const processingResult = await this.processor.execute({
      documentId: state.documentId,
      documentIdExt: state.documentIdExt,
      workspaceIdExt: state.workspaceIdExt,
      filename: state.filename,
      contentType: state.contentType,
      pages: parsedDocument.pages,
      totalPages: parsedDocument.totalPages,
      metadata: parsedDocument.metadata,
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap,
      chunkText: this.chunkText,
    })

    if (isSome(processingResult)) {
      await this.cleanupPersistedContent(state)
      return err(processingResult.value)
    }

    const updateResult = await this.uploads.updateById(state.id, {
      lastCompletedStep: 'content_indexed',
      currentStep: 'finalized',
      heartbeatAt: new Date(),
    })

    if (isSome(updateResult)) {
      await this.cleanupPersistedContent(state)
      return err(updateResult.value)
    }

    return ok({
      ...state,
      lastCompletedStep: 'content_indexed',
      currentStep: 'finalized',
    })
  }

  private async finalizeSuccess(state: DocumentUploadDTO): Promise<Option<Error>> {
    this.log.info(
      { jobId: state.jobIdExt, documentIdExt: state.documentIdExt },
      'saga: finalizing successful ingestion',
    )

    const documentUpdate = await this.writer.updateDocument(state.documentIdExt, {
      status: 'ready',
      failureReason: null,
    })

    if (isErr(documentUpdate)) {
      return some(
        documentUpdate.left instanceof Error
          ? documentUpdate.left
          : new VErrorUnknown({
              message: 'Failed to update document to ready',
              context: { documentIdExt: state.documentIdExt },
            }),
      )
    }

    const uploadUpdate = await this.uploads.updateById(state.id, {
      status: 'completed',
      lastCompletedStep: 'finalized',
      currentStep: 'finalized',
      finishedAt: new Date(),
      heartbeatAt: new Date(),
      errorMessage: null,
    })

    if (isSome(uploadUpdate)) {
      return uploadUpdate
    }

    this.log.info(
      { jobId: state.jobIdExt, documentIdExt: state.documentIdExt },
      'saga: ingestion completed successfully',
    )
    return none
  }

  private async handleFailure(state: DocumentUploadDTO, cause: unknown): Promise<void> {
    const errorMessage = this.extractErrorMessage(cause)

    this.log.error(
      { jobId: state.jobIdExt, documentIdExt: state.documentIdExt, error: cause },
      'saga: ingestion failed, executing compensations',
    )

    await this.runCompensations(state)

    const documentUpdate = await this.writer.updateDocument(state.documentIdExt, {
      status: 'failed',
      failureReason: errorMessage,
    })

    if (isErr(documentUpdate)) {
      this.log.error(
        { documentIdExt: state.documentIdExt, error: documentUpdate.left },
        'failed to update document status',
      )
    }

    const uploadUpdate = await this.uploads.updateById(state.id, {
      status: 'failed',
      errorMessage,
      finishedAt: new Date(),
      heartbeatAt: new Date(),
    })

    if (isSome(uploadUpdate)) {
      this.log.error({ jobId: state.jobIdExt, error: uploadUpdate.value }, 'failed to persist upload failure state')
    }
  }

  private extractErrorMessage(cause: unknown): string {
    if (cause instanceof Error) {
      return cause.message
    }
    if (typeof cause === 'string') {
      return cause
    }
    return 'Unknown ingestion failure'
  }

  private async runCompensations(state: DocumentUploadDTO): Promise<void> {
    const lastStep = state.lastCompletedStep ?? 'pending'

    if (this.getStepIndex(lastStep) >= this.getStepIndex('content_indexed')) {
      await this.cleanupPersistedContent(state)
    }

    if (this.getStepIndex(lastStep) >= this.getStepIndex('file_reference')) {
      await this.writer.deleteFileReference(state.documentId)
    }

    if (this.getStepIndex(lastStep) >= this.getStepIndex('storage_upload')) {
      await this.safeRemoveRemoteFile(state.storageBucket ?? undefined, state.storageObjectKey ?? undefined)
    }
  }

  private async cleanupPersistedContent(state: DocumentUploadDTO): Promise<void> {
    const compensationErrors: Option<Error>[] = []

    compensationErrors.push(await this.writer.deleteMetadata(state.documentId))
    compensationErrors.push(await this.writer.deletePages(state.documentId))

    const vectorDeletion = await this.vectorRepository.deleteDocumentVectors(state.documentIdExt, state.workspaceIdExt)

    if (isSome(vectorDeletion)) {
      compensationErrors.push(vectorDeletion)
    }

    for (const errorOption of compensationErrors) {
      if (isSome(errorOption)) {
        this.log.warn(
          {
            jobId: state.jobIdExt,
            documentIdExt: state.documentIdExt,
            error: errorOption.value,
          },
          'compensation: content cleanup encountered error',
        )
      }
    }
  }

  private async safeRemoveRemoteFile(bucket?: string, objectKey?: string): Promise<void> {
    if (!bucket || !objectKey) {
      return
    }

    const removalResult = await this.storage.remove({ bucket, objectKey })

    if (isSome(removalResult)) {
      this.log.warn(
        { bucket, objectKey, error: removalResult.value },
        'compensation: failed to remove file from remote storage',
      )
    }
  }

  private async removeTempFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath)
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') {
        this.log.warn({ filePath, error }, 'failed to remove temporary upload file')
      }
    }
  }
}
