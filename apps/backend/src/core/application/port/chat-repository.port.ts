// c3
import type { Failable, Option } from '@c3-oss/functional'

// internal
import type { ChatDTO, ChatInsertDTO, ChatMessageDTO, ChatMessageInsertDTO } from '~application/dto/index.js'

// ---------------------------------------------------------------------------------------------------------------------

export interface ChatRepositoryPort {
  /** Creates a chat and returns identifiers. */
  create(chat: ChatInsertDTO): Promise<Failable<{ id: number; idExt: string }>>

  /** Retrieves chat by external id. */
  get(idExt: string): Promise<Failable<Option<ChatDTO>>>

  /** Creates a message and returns identifiers. */
  createMessage(message: ChatMessageInsertDTO): Promise<Failable<{ id: number; idExt: string }>>

  /** Lists messages by chat external id ordered by createdAt asc. */
  listMessages(chatIdExt: string): Promise<Failable<ChatMessageDTO[]>>
}
