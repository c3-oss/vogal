// 3rd-party
import { boolean, index, integer, pgSchema, serial, timestamp, varchar } from 'drizzle-orm/pg-core'

// c3
import { ulidUniqueKey } from '@c3-oss/drizzle-ulid'

// internal
import { tableUsers } from '../user/user.schema.js'

// ---------------------------------------------------------------------------------------------------------------------

export const schemaWorkspaces = pgSchema('workspaces')

export const tableWorkspaces = schemaWorkspaces.table(
  'workspaces',
  {
    id: serial('id').primaryKey(),
    idExt: ulidUniqueKey('id_ext').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    userId: integer('user_id')
      .notNull()
      .references(() => tableUsers.id, { onDelete: 'cascade' }),
    isDeleted: boolean('is_deleted').notNull().default(false),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('idx_user_id').on(t.userId)],
)
