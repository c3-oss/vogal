// 3rd-party
import { integer, pgSchema, serial, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core'

// internal
import { tableDocuments } from '../document/document.schema.js'

// ---------------------------------------------------------------------------------------------------------------------

export const schemaDocumentMetadata = pgSchema('documents')

export const tableDocumentMetadata = schemaDocumentMetadata.table(
  'document_metadata',
  {
    id: serial('id').primaryKey(),
    documentId: integer('document_id')
      .notNull()
      .references(() => tableDocuments.id, { onDelete: 'cascade' }),
    key: varchar('key', { length: 100 }).notNull(),
    value: text('value').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('ux_doc_meta').on(t.documentId, t.key)],
)
