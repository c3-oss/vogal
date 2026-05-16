// 3rd-party
import type { FastifyReply as Reply, FastifyRequest as Request } from 'fastify'

// c3
import { isErr, val } from '@c3-oss/functional'

// internal
import { BaseController } from '~/adapter/in/http/common/base-controller.js'

import {
  DocumentIdExtParamsSchema,
  DocumentsListQuerySchema,
  UpdateDocumentBodySchema,
} from '~validators/documents.validators.js'

import type { DocumentDTO } from '~application/dto/index.js'
import type { DocumentRepositoryPort } from '~application/port/index.js'
import type { Jsonifiable } from '~infra/contracts.js'
import type { UpdateDocumentUseCase } from '~usecase/document/update-document.js'

// ---------------------------------------------------------------------------------------------------------------------

interface DocumentsControllerDependencies {
  documentRepository: DocumentRepositoryPort
  updateDocument: UpdateDocumentUseCase
}

export class DocumentsController extends BaseController {
  private readonly documentRepository: DocumentRepositoryPort
  private readonly updateDocument: UpdateDocumentUseCase

  public constructor(deps: DocumentsControllerDependencies) {
    super()

    const { documentRepository, updateDocument } = deps
    this.invariant({ documentRepository, updateDocument })

    this.documentRepository = documentRepository
    this.updateDocument = updateDocument
  }

  private filterDocumentData(document: DocumentDTO): Jsonifiable {
    return {
      id: document.idExt,
      filename: document.filename,
      workspaceId: document.workspaceId,
      contentType: document.contentType,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    } as unknown as Jsonifiable
  }

  public async handle(req: Request, reply: Reply): Promise<void> {
    const parsed = DocumentsListQuerySchema.safeParse(req.query ?? {})
    if (!parsed.success) {
      throw parsed.error
    }

    /* ... */

    const { orderField, orderDirection, limit, page, workspaceId } = parsed.data

    const docsResult = await this.documentRepository.listForUI({
      workspaceIdExt: workspaceId,
      limit,
      page,
      orderField,
      orderDirection,
    })

    if (isErr(docsResult)) {
      throw docsResult.left
    }

    this.sendResponse(reply, 200, docsResult.right as unknown as Jsonifiable)
  }

  public async update(req: Request, reply: Reply): Promise<void> {
    const params = DocumentIdExtParamsSchema.safeParse(req.params)
    if (!params.success) {
      throw params.error
    }

    /* ... */

    const body = UpdateDocumentBodySchema.safeParse(req.body ?? {})
    if (!body.success) {
      throw body.error
    }

    /* ... */

    const result = await this.updateDocument.execute({ idExt: params.data.idExt, ...body.data })
    if (isErr(result)) {
      throw result.left
    }

    this.sendResponse(reply, 200, this.filterDocumentData(val(result)))
  }
}
