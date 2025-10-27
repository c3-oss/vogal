// c3
import type { Failable, Option } from '@c3-oss/functional'

// internal
import type {
  PaginatedResultDTO,
  PaginationQueryDTO,
  UserDTO,
  UserInsertDTO,
  UserUpdateDTO,
} from '~application/dto/index.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Port for user data operations.
 */
export interface UserRepositoryPort {
  /** Creates a new user record. */
  create(user: UserInsertDTO): Promise<Failable<string>>
  /** Retrieves a user by external ID. */
  get(idExt: string): Promise<Failable<Option<UserDTO>>>
  /** Retrieves a user by email address. */
  getByEmail(email: string): Promise<Failable<Option<UserDTO>>>
  /** Retrieves all users with optional pagination. */
  getAll(filters?: PaginationQueryDTO): Promise<Failable<PaginatedResultDTO<UserDTO>>>
  /** Updates an existing user record. */
  update(idExt: string, user: UserUpdateDTO): Promise<Failable<Option<UserDTO>>>
  /** Deletes a user by external ID. */
  delete(idExt: string): Promise<Option<Error>>
}
