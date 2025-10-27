// internal
/**
 * Job data for PDF document ingestion processing.
 */
export interface IngestJob {
  /** Internal workspace identifier. */
  workspaceId: number
  /** External workspace identifier. */
  workspaceIdExt: string
  /** Internal document identifier. */
  documentId: number
  /** External document identifier. */
  documentIdExt: string
  /** Name of the uploaded file. */
  filename: string
  /** MIME type of the document. */
  contentType: string
  /** Path to the uploaded file. */
  filePath: string
}

/**
 * Port for background processing operations.
 */
export interface BackgroundProcessingPort {
  /** Queues a PDF document for ingestion processing. */
  enqueuePdfIngestion(job: IngestJob): Promise<void>
}
