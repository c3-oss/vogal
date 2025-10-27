// c3
import { type Failable, err, isErr, isNone, ok, val } from '@c3-oss/functional'
import type { Logger } from '@c3-oss/logger'

// internal
import { VErrorInvalidInput, VErrorNotFound } from '~/infra/errors/index.js'
import { BaseUseCase } from '~application/usecase/base-usecase.js'

import type { DocumentDTO } from '~application/dto/index.js'
import type { DocumentRepositoryPort } from '~application/port/index.js'

// ---------------------------------------------------------------------------------------------------------------------

export interface UpdateDocumentUseCaseDeps {
  documentRepository: DocumentRepositoryPort
  logger: Logger
}

export interface UpdateDocumentParams {
  idExt: string
  filename: string
}

export class UpdateDocumentUseCase extends BaseUseCase {
  private readonly documentRepository: DocumentRepositoryPort
  private readonly log: Logger

  public constructor(deps: UpdateDocumentUseCaseDeps) {
    super()

    const { documentRepository, logger } = deps
    this.invariant({ documentRepository, logger })

    this.documentRepository = documentRepository
    this.log = logger.child({ usecase: 'UpdateDocumentUseCase' })
  }

  public async execute(params: UpdateDocumentParams): Promise<Failable<DocumentDTO>> {
    const { idExt, filename } = params
    this.log.info({ idExt }, 'update document requested')

    if (!filename || filename.length === 0) {
      return err(new VErrorInvalidInput({ message: 'Document filename is required' }))
    }

    const documentResult = await this.documentRepository.get(idExt)
    if (isErr(documentResult)) {
      this.log.warn({ idExt, error: documentResult.left }, 'failed to load document before update')
      return documentResult
    }

    const documentOption = val(documentResult)
    if (isNone(documentOption)) {
      this.log.warn({ idExt }, 'document not found for update')
      return err(new VErrorNotFound({ message: 'Document not found' }))
    }

    const existing = documentOption.value
    if (existing.filename === filename) {
      this.log.info({ idExt }, 'document filename unchanged, skipping update')
      return ok(existing)
    }

    const updateResult = await this.documentRepository.update(idExt, { filename })
    if (isErr(updateResult)) {
      this.log.warn({ idExt, error: updateResult.left }, 'failed to update document')
      return updateResult
    }

    const updatedOption = val(updateResult)
    if (isNone(updatedOption)) {
      this.log.warn({ idExt }, 'document not found during update persistence')
      return err(new VErrorNotFound({ message: 'Document not found' }))
    }

    this.log.info({ idExt }, 'document updated successfully')
    return ok(updatedOption.value)
  }
}
