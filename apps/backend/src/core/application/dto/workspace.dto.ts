// internal
import type { tableWorkspaces } from '~/adapter/out/db/model/schema.js'

// ---------------------------------------------------------------------------------------------------------------------

/** Complete workspace data from database. */
export type WorkspaceDTO = typeof tableWorkspaces.$inferSelect
/** Data required to insert a new workspace. */
export type WorkspaceInsertDTO = typeof tableWorkspaces.$inferInsert
/** Data allowed for workspace updates. */
export type WorkspaceUpdateDTO = Partial<Pick<WorkspaceInsertDTO, 'name'>>
