// 3rd-party
import { integer, pgSchema, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

// c3
import { tableDocuments } from '../document/document.schema.js'

// ---------------------------------------------------------------------------------------------------------------------

export const schemaDocumentPages = pgSchema('documents')

export const tableDocumentPages = schemaDocumentPages.table(
  'document_pages',
  {
    id: serial('id').primaryKey(),
    documentId: integer('document_id')
      .notNull()
      .references(() => tableDocuments.id, { onDelete: 'cascade' }),
    pageNumber: integer('page_number').notNull(),
    rawContent: text('raw_content').notNull(),
    normalizedContent: text('normalized_content').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('ux_doc_page').on(t.documentId, t.pageNumber)],
)
