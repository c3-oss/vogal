// 3rd-party
import { initTRPC } from '@trpc/server'
import { z } from 'zod'

// internal
import { DocumentStatusParamsSchema } from '~in/http/validators/document-status.validators.js'
import {
  DocumentIdExtParamsSchema,
  DocumentsListQuerySchema,
  UpdateDocumentBodySchema,
} from '~in/http/validators/documents.validators.js'
import { rightOrThrow, someOrThrow } from '../trpc-errors.js'
import type { RouterDeps } from '../types.js'

// ---------------------------------------------------------------------------------------------------------------------

const t = initTRPC.context<Record<string, never>>().create()

export const documentsRouter = (deps: RouterDeps) =>
  t.router({
    list: t.procedure.input(DocumentsListQuerySchema).query(async ({ input }) => {
      const { orderField, orderDirection, limit, page, workspaceId } = input
      const docs = await deps.repositories.documentRepository.listForUI({
        workspaceIdExt: workspaceId,
        limit,
        page,
        orderField,
        orderDirection,
      })
      return rightOrThrow(docs)
    }),

    update: t.procedure
      .input(
        z.object({
          params: DocumentIdExtParamsSchema,
          body: UpdateDocumentBodySchema,
        }),
      )
      .mutation(async ({ input }) => {
        const result = await deps.useCases.updateDocument.execute({ idExt: input.params.idExt, ...input.body })
        const doc = rightOrThrow(result)
        return {
          id: doc.idExt,
          filename: doc.filename,
          workspaceId: doc.workspaceId,
          contentType: doc.contentType,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        }
      }),

    status: t.procedure.input(DocumentStatusParamsSchema).query(async ({ input }) => {
      const status = await deps.repositories.uploadsRepository.getByDocumentIdExt(input.idExt)
      const upload = someOrThrow(rightOrThrow(status), 'Status not found')
      const {
        id: _privateId,
        documentId: _documentId,
        jobIdExt,
        status: uploadStatus,
        currentStep,
        lastCompletedStep,
        retryCount,
        errorMessage,
        documentStatus,
        documentFailureReason,
        storageProvider,
        storageBucket,
        storageObjectKey,
        startedAt,
        finishedAt,
        createdAt,
        updatedAt,
      } = upload

      return {
        jobId: jobIdExt,
        status: uploadStatus,
        currentStep,
        lastCompletedStep: lastCompletedStep ?? 'pending',
        retryCount,
        errorMessage,
        documentStatus,
        documentFailureReason,
        storage:
          storageProvider && storageBucket && storageObjectKey
            ? {
                provider: storageProvider,
                bucket: storageBucket,
                objectKey: storageObjectKey,
              }
            : undefined,
        startedAt,
        finishedAt,
        createdAt,
        updatedAt,
      }
    }),
  })
