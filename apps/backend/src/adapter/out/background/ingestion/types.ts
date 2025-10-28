// c3
import type { Logger } from '@c3-oss/logger'

// internal
import type {
  DocumentMetadataBasicInfoDTO,
  DocumentPageBasicInfoDTO,
  DocumentUploadDTO,
} from '~application/dto/index.js'
import type { BackgroundProcessingPort, IngestJob } from '~application/port/background-processing.port.js'
import type { StorageProvider, StorageProviderPort } from '~application/port/storage-provider.port.js'
import type { DocumentUploadRepository } from '~out/db/model/document-uploads/document-upload.repository.js'
import type { DocumentWriteAdapter } from '~out/db/model/document/document-write.adapter.js'
import type { VogalRepositoryPort } from '~port/vogal-repository.port.js'
import type { ProcessPdfUseCase } from '~usecase/document/process-pdf.js'

// ---------------------------------------------------------------------------------------------------------------------

interface ParsePdfResult {
  pages: DocumentPageBasicInfoDTO[]
  totalPages: number
  metadata: Partial<DocumentMetadataBasicInfoDTO>
}

/**
 * Finite list of ingestion steps captured in the uploads table.
 * Keeping the order centralized allows orchestration helpers to stay declarative.
 */
export type UploadStep = DocumentUploadDTO['currentStep']

export const STEP_ORDER: readonly UploadStep[] = [
  'pending',
  'storage_upload',
  'file_reference',
  'content_indexed',
  'finalized',
]

/**
 * Dependencies injected into the background saga.
 * Each field corresponds to an adapter or pure function used across the steps.
 */
export interface SagaDependencies {
  uploads: DocumentUploadRepository
  writer: DocumentWriteAdapter
  storage: StorageProviderPort
  processor: ProcessPdfUseCase
  vectorRepository: VogalRepositoryPort
  parsePdf: (filePath: string) => Promise<ParsePdfResult>
  chunkText: (text: string, chunkSize: number, overlap: number) => string[]
  chunkSize: number
  chunkOverlap: number
  logger: Logger
}

export interface IngestEventPayload {
  uploadId: number
}

export type { BackgroundProcessingPort, IngestJob, StorageProvider, StorageProviderPort, DocumentUploadDTO }
