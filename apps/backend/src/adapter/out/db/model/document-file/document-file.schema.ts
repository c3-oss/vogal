// 3rd-party
import { integer, pgEnum, pgSchema, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'

// internal
import { tableDocuments } from '../document/document.schema.js'

// ---------------------------------------------------------------------------------------------------------------------

export const schemaDocumentFiles = pgSchema('documents')

export const storageProviderEnum = pgEnum('storage_provider', ['s3', 'firebase'])

export const tableDocumentFiles = schemaDocumentFiles.table('document_files', {
  id: serial('id').primaryKey(),
  documentId: integer('document_id')
    .notNull()
    .references(() => tableDocuments.id, { onDelete: 'cascade' }),
  provider: storageProviderEnum('provider').notNull(),
  bucket: varchar('bucket', { length: 255 }).notNull(),
  objectKey: text('object_key').notNull(),
  publicUrl: text('public_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
