// internal
import type { tableChatMessages, tableChats } from '~/adapter/out/db/model/chat/chat.schema.js'

// ---------------------------------------------------------------------------------------------------------------------

/** Complete chat data from database. */
export type ChatDTO = typeof tableChats.$inferSelect
/** Data required to insert a new chat. */
export type ChatInsertDTO = typeof tableChats.$inferInsert

/** Complete chat message data from database. */
export type ChatMessageDTO = typeof tableChatMessages.$inferSelect
/** Data required to insert a new chat message. */
export type ChatMessageInsertDTO = typeof tableChatMessages.$inferInsert

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool'
