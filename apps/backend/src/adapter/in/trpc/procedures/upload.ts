// standard
import fs from 'node:fs/promises'

// 3rd-party
import { initTRPC } from '@trpc/server'
import { z } from 'zod'

// internal
import { UploadBodySchema } from '~in/http/validators/upload.validators.js'
import { normalizeFilename } from '~infra/filename.js'
import { rightOrThrow, someOrThrow, toTRPCError } from '../trpc-errors.js'
import type { RouterDeps } from '../types.js'

// ---------------------------------------------------------------------------------------------------------------------

const t = initTRPC.context<Record<string, never>>().create()

export const uploadRouter = (deps: RouterDeps) =>
  t.router({
    pdfB64: t.procedure
      .input(
        z.object({
          body: UploadBodySchema,
          filename: z.string().min(1),
          contentType: z.literal('application/pdf'),
          fileB64: z.string().min(1),
        }),
      )
      .mutation(async ({ input }) => {
        const { body, filename, contentType, fileB64 } = input
        const workspaceResult = await deps.useCases.getWorkspace.execute({ idExt: body.workspaceId })
        const workspace = someOrThrow(rightOrThrow(workspaceResult), 'Workspace not found')

        const normalizedName = normalizeFilename(filename)

        const documentResult = await deps.useCases.writer.createDocument({
          workspaceId: workspace.id,
          filename: normalizedName,
          contentType,
        })
        const { id: documentId, idExt: documentIdExt } = rightOrThrow(documentResult)

        const buffer = Buffer.from(fileB64, 'base64')
        const filePath = `uploads/${documentIdExt}-${normalizedName}`
        await fs.writeFile(filePath, buffer)

        const cleanup = async () => {
          try {
            await fs.unlink(filePath)
          } catch {}
        }

        try {
          await deps.background.enqueuePdfIngestion({
            workspaceId: workspace.id,
            workspaceIdExt: workspace.idExt,
            documentId,
            documentIdExt,
            filename: normalizedName,
            contentType,
            filePath,
          })
        } catch (error) {
          await cleanup()
          throw toTRPCError(error)
        }

        deps.log.info({ documentIdExt }, 'tRPC upload enqueued')
        return { documentId: documentIdExt }
      }),
  })
