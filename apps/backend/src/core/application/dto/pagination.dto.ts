// ---------------------------------------------------------------------------------------------------------------------

/**
 * Query parameters for pagination and sorting.
 */
export interface PaginationQueryDTO {
  /** Maximum number of items per page. */
  limit?: number
  /** Page number to retrieve (1-based). */
  page?: number
  /** Field name to sort by. */
  orderField?: string
  /** Sort direction. */
  orderDirection?: 'asc' | 'desc'
}

/**
 * Metadata information for paginated results.
 */
export interface PaginationMetaDTO {
  /** Total number of results across all pages. */
  totalResults: number
  /** Total number of pages available. */
  totalPages: number
  /** Current page number. */
  currentPage: number
  /** Whether there is a next page available. */
  hasNextPage: boolean
  /** Whether there is a previous page available. */
  hasPreviousPage: boolean
}

/**
 * Generic paginated result wrapper.
 */
export interface PaginatedResultDTO<T> {
  /** Pagination metadata. */
  meta: PaginationMetaDTO
  /** Array of items for the current page. */
  items: T[]
}
