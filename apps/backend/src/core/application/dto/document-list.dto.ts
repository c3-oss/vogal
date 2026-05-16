// ---------------------------------------------------------------------------------------------------------------------

export type DocumentListStatus = 'pending' | 'processing' | 'failed' | 'ready'

export interface DocumentListItemDTO {
  documentId: string
  filename: string
  status: DocumentListStatus
  failureReason: string | null
  currentStep: string | null
  lastCompletedStep: string | null
  errorMessage: string | null
  workspaceId: string
  workspaceName: string
  createdAt: Date
  updatedAt: Date
}

export interface DocumentListQueryDTO {
  workspaceIdExt?: string
  limit: number
  page: number
  orderField: 'createdAt' | 'filename' | 'status'
  orderDirection: 'asc' | 'desc'
}
