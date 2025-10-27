/**
 * Result data from PDF upload and processing operations.
 */
export interface UploadPdfResultDTO {
  /** Whether the upload and processing was successful. */
  success: boolean
  /** External identifier of the created document. */
  documentId: string
  /** Name of the uploaded file. */
  filename: string
  /** Total number of pages extracted from the PDF. */
  totalPages: number
  /** Total number of text chunks created for indexing. */
  totalChunks: number
  /** Status message or error description. */
  message: string
}
