// 3rd-party
import { index, integer, pgSchema, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'

// c3
import { ulidUniqueKey } from '@c3-oss/drizzle-ulid'

// internal
import { tableWorkspaces } from '../workspace/workspace.schema.js'

// ---------------------------------------------------------------------------------------------------------------------

export const schemaChats = pgSchema('chats')

export const tableChats = schemaChats.table(
  'chats',
  {
    id: serial('id').primaryKey(),
    idExt: ulidUniqueKey('id_ext').notNull(),
    workspaceId: integer('workspace_id')
      .notNull()
      .references(() => tableWorkspaces.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('idx_workspace_id').on(t.workspaceId)],
)

export const tableChatMessages = schemaChats.table(
  'chat_messages',
  {
    id: serial('id').primaryKey(),
    idExt: ulidUniqueKey('id_ext').notNull(),
    chatId: integer('chat_id')
      .notNull()
      .references(() => tableChats.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 16 }).notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('idx_chat_id').on(t.chatId)],
)
