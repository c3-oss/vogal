// c3
import type { Failable, Option } from '@c3-oss/functional'

// internal
import type {
  PaginatedResultDTO,
  PaginationQueryDTO,
  WorkspaceDTO,
  WorkspaceInsertDTO,
  WorkspaceUpdateDTO,
} from '~application/dto/index.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Port for workspace data operations.
 */
export interface WorkspaceRepositoryPort {
  /** Creates a new workspace record. */
  create(workspace: WorkspaceInsertDTO): Promise<Failable<string>>
  /** Retrieves a workspace by external ID. */
  get(idExt: string): Promise<Failable<Option<WorkspaceDTO>>>
  /** Retrieves all workspaces with optional pagination. */
  getAll(filters?: PaginationQueryDTO): Promise<Failable<PaginatedResultDTO<WorkspaceDTO>>>
  /** Retrieves all workspaces owned by a specific user. */
  getByUser(userId: string): Promise<Failable<Option<WorkspaceDTO[]>>>
  /** Updates an existing workspace record. */
  update(idExt: string, workspace: WorkspaceUpdateDTO): Promise<Failable<Option<WorkspaceDTO>>>
  /** Deletes a workspace by external ID. */
  delete(idExt: string): Promise<Option<Error>>
}
