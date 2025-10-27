// 3rd-party
import { index, integer, pgEnum, pgSchema, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'

// c3
import { ulidUniqueKey } from '@c3-oss/drizzle-ulid'

// internal
import { tableWorkspaces } from '../workspace/workspace.schema.js'

// ---------------------------------------------------------------------------------------------------------------------

export const schemaDocuments = pgSchema('documents')

export const documentStatusEnum = pgEnum('document_status', ['pending', 'processing', 'failed', 'ready'])

export const tableDocuments = schemaDocuments.table(
  'documents',
  {
    id: serial('id').primaryKey(),
    idExt: ulidUniqueKey('id_ext').notNull(),
    workspaceId: integer('workspace_id')
      .notNull()
      .references(() => tableWorkspaces.id, { onDelete: 'cascade' }),
    filename: varchar('filename', { length: 255 }).notNull(),
    contentType: varchar('content_type', { length: 100 }).notNull(),
    status: documentStatusEnum('status').notNull().default('pending'),
    failureReason: text('failure_reason'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('idx_filename').on(t.filename), index('idx_workspace_id').on(t.workspaceId)],
)
