// standard
import fs from 'node:fs/promises'

// 3rd-party
import '@fastify/multipart'
import type { FastifyReply as Reply, FastifyRequest as Request } from 'fastify'

// c3
import { isErr, isNone, val } from '@c3-oss/functional'

// internal
import { BaseController } from '~/adapter/in/http/common/base-controller.js'
import { VErrorInvalidContentType, VErrorMalformedRequest, VErrorNotFound } from '~/infra/errors/index.js'
import { normalizeFilename } from '~infra/filename.js'
import { UploadBodySchema } from '~validators/upload.validators.js'

import type { BackgroundProcessingPort, DocumentWritePort } from '~application/port/index.js'
import type { Jsonifiable } from '~infra/contracts.js'
import type { GetWorkspaceUseCase } from '~usecase/workspace/get-workspace.js'

// ---------------------------------------------------------------------------------------------------------------------

export interface UploadControllerDependencies {
  writer: DocumentWritePort
  background: BackgroundProcessingPort
  getWorkspace: GetWorkspaceUseCase
}

export class UploadController extends BaseController {
  private readonly writer: DocumentWritePort
  private readonly background: BackgroundProcessingPort
  private readonly getWorkspace: GetWorkspaceUseCase

  public constructor(deps: UploadControllerDependencies) {
    super()

    const { writer, background, getWorkspace } = deps
    this.invariant({ writer, background, getWorkspace })

    this.writer = writer
    this.background = background
    this.getWorkspace = getWorkspace
  }

  public async handle(req: Request, reply: Reply): Promise<void> {
    const data = await req.file()

    if (!data) {
      throw new VErrorMalformedRequest({ message: 'No file sent' })
    }

    if (data.mimetype !== 'application/pdf') {
      throw new VErrorInvalidContentType({
        message: 'Only PDF files are supported',
        context: { receivedType: data.mimetype, filename: data.filename },
      })
    }

    // Parse body fields
    const bodyFields: Record<string, unknown> = {}
    for (const field of Object.keys(data.fields)) {
      const fieldData = data.fields[field]
      if (fieldData && typeof fieldData === 'object' && 'value' in fieldData) {
        bodyFields[field] = fieldData.value
      }
    }

    const bodyParsing = UploadBodySchema.safeParse(bodyFields)
    if (!bodyParsing.success) {
      throw bodyParsing.error
    }

    const { workspaceId } = bodyParsing.data

    const workspaceResult = await this.getWorkspace.execute({ idExt: workspaceId })
    if (isErr(workspaceResult)) {
      throw workspaceResult.left
    }

    const workspaceOption = val(workspaceResult)
    if (isNone(workspaceOption)) {
      throw new VErrorNotFound({ message: 'Workspace not found' })
    }

    const workspace = workspaceOption.value
    const normalizedName = normalizeFilename(data.filename)

    // Save file to temporary location
    const tmpPath = `/tmp/${Date.now()}-${normalizedName}`
    const buffer = await data.toBuffer()
    await fs.writeFile(tmpPath, buffer)

    const cleanupTempFile = async () => {
      try {
        await fs.unlink(tmpPath)
      } catch {}
    }

    const documentResult = await this.writer.createDocument({
      workspaceId: workspace.id,
      filename: normalizedName,
      contentType: data.mimetype,
    })
    if (isErr(documentResult)) {
      await cleanupTempFile()
      throw documentResult.left
    }
    const { id: documentId, idExt: documentIdExt } = val(documentResult)

    try {
      await this.background.enqueuePdfIngestion({
        workspaceId: workspace.id,
        workspaceIdExt: workspace.idExt,
        documentId,
        documentIdExt,
        filename: normalizedName,
        contentType: data.mimetype,
        filePath: tmpPath,
      })
    } catch (error) {
      await cleanupTempFile()
      throw error
    }

    this.sendResponse(reply, 202, { documentId: documentIdExt } as unknown as Jsonifiable)
  }
}
