// 3rd-party
import { boolean, index, pgSchema, serial, timestamp, varchar } from 'drizzle-orm/pg-core'

// c3
import { ulidUniqueKey } from '@c3-oss/drizzle-ulid'

// ---------------------------------------------------------------------------------------------------------------------

export const schemaUsers = pgSchema('users')

export const tableUsers = schemaUsers.table(
  'users',
  {
    id: serial('id').primaryKey(),
    idExt: ulidUniqueKey('id_ext').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    isDeleted: boolean('is_deleted').notNull().default(false),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('idx_email').on(t.email)],
)
