// 3rd-party
import type { FastifyReply as Reply, FastifyRequest as Request } from 'fastify'

// c3
import { isErr, isNone, val } from '@c3-oss/functional'

// internal
import { BaseController } from '~/adapter/in/http/common/base-controller.js'
import { VErrorNotFound } from '~/infra/errors/index.js'
import type { DocumentUploadRepository } from '~out/db/model/document-uploads/document-upload.repository.js'
import { DocumentStatusParamsSchema } from '~validators/document-status.validators.js'

// ---------------------------------------------------------------------------------------------------------------------

interface DocumentStatusControllerDependencies {
  uploads: DocumentUploadRepository
}

export class DocumentStatusController extends BaseController {
  private readonly uploads: DocumentUploadRepository

  public constructor(deps: DocumentStatusControllerDependencies) {
    super()

    const { uploads } = deps
    this.invariant({ uploads })

    this.uploads = uploads
  }

  public async handle(req: Request, reply: Reply): Promise<void> {
    const paramsParsing = DocumentStatusParamsSchema.safeParse(req.params)
    if (!paramsParsing.success) {
      throw paramsParsing.error
    }

    const { idExt } = paramsParsing.data

    const statusResult = await this.uploads.getByDocumentIdExt(idExt)
    if (isErr(statusResult)) {
      throw statusResult.left
    }

    const statusOption = val(statusResult)
    if (isNone(statusOption)) {
      throw new VErrorNotFound({ message: 'Document status not found' })
    }

    const upload = statusOption.value

    const response = {
      jobId: upload.jobIdExt,
      status: upload.status,
      currentStep: upload.currentStep,
      lastCompletedStep: upload.lastCompletedStep ?? 'pending',
      retryCount: upload.retryCount,
      errorMessage: upload.errorMessage,
      documentStatus: upload.documentStatus,
      documentFailureReason: upload.documentFailureReason,
      storage:
        upload.storageProvider && upload.storageBucket && upload.storageObjectKey
          ? {
              provider: upload.storageProvider,
              bucket: upload.storageBucket,
              objectKey: upload.storageObjectKey,
            }
          : undefined,
      startedAt: upload.startedAt,
      finishedAt: upload.finishedAt,
      createdAt: upload.createdAt,
      updatedAt: upload.updatedAt,
    }

    this.sendResponse(reply, 200, response)
  }
}
