// internal
import type { tableUsers } from '~/adapter/out/db/model/schema.js'

// ---------------------------------------------------------------------------------------------------------------------

/** Complete user data from database. */
export type UserDTO = typeof tableUsers.$inferSelect
/** Data required to insert a new user. */
export type UserInsertDTO = typeof tableUsers.$inferInsert
/** Data allowed for user updates. */
export type UserUpdateDTO = Partial<Pick<UserInsertDTO, 'name' | 'email'>>
