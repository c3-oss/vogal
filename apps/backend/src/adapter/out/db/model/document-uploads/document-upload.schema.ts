// 3rd-party
import { integer, pgEnum, pgSchema, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'

// c3
import { ulidUniqueKey } from '@c3-oss/drizzle-ulid'

// internal
import { tableDocuments } from '../document/document.schema.js'
import { tableWorkspaces } from '../workspace/workspace.schema.js'

// ---------------------------------------------------------------------------------------------------------------------

export const schemaDocumentUploads = pgSchema('documents')

export const uploadStatusEnum = pgEnum('upload_status', ['queued', 'processing', 'completed', 'failed'])
export const uploadStepEnum = pgEnum('upload_step', [
  'pending',
  'storage_upload',
  'file_reference',
  'content_indexed',
  'finalized',
])

export const tableDocumentUploads = schemaDocumentUploads.table('document_uploads', {
  id: serial('id').primaryKey(),
  jobIdExt: ulidUniqueKey('job_id_ext').notNull(),
  documentId: integer('document_id')
    .notNull()
    .references(() => tableDocuments.id, { onDelete: 'cascade' }),
  documentIdExt: varchar('document_id_ext', { length: 26 }).notNull(),
  workspaceId: integer('workspace_id')
    .notNull()
    .references(() => tableWorkspaces.id, { onDelete: 'cascade' }),
  workspaceIdExt: varchar('workspace_id_ext', { length: 26 }).notNull(),
  filename: varchar('filename', { length: 255 }).notNull(),
  contentType: varchar('content_type', { length: 100 }).notNull(),
  tempFilePath: text('temp_file_path').notNull(),
  storageProvider: varchar('storage_provider', { length: 20 }),
  storageBucket: varchar('storage_bucket', { length: 255 }),
  storageObjectKey: varchar('storage_object_key', { length: 512 }),
  status: uploadStatusEnum('status').notNull().default('queued'),
  currentStep: uploadStepEnum('current_step').notNull().default('pending'),
  lastCompletedStep: uploadStepEnum('last_completed_step'),
  retryCount: integer('retry_count').notNull().default(0),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at'),
  finishedAt: timestamp('finished_at'),
  heartbeatAt: timestamp('heartbeat_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
