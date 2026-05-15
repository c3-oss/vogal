// 3rd-party
import { type Failable, type Option, err, none, ok, some } from '@c3-oss/functional'
import { asc, eq } from 'drizzle-orm'

// internal
import type { DBClient } from '~adapter/out/db/pgconn.js'
import type { ChatDTO, ChatInsertDTO, ChatMessageDTO, ChatMessageInsertDTO } from '~application/dto/index.js'
import { BaseRepository } from '../base-repository.js'
import { tableChatMessages, tableChats } from './chat.schema.js'

// ---------------------------------------------------------------------------------------------------------------------

export class ChatRepository extends BaseRepository {
  private readonly db: DBClient

  public constructor(db: DBClient) {
    super()

    this.invariant(db, { skipKeys: true })
    this.db = db
  }

  public async create(chat: ChatInsertDTO): Promise<Failable<{ id: number; idExt: string }>> {
    try {
      const [created] = await this.db.insert(tableChats).values(chat).returning()
      if (!created) return err('Failed to create chat')
      return ok({ id: created.id, idExt: created.idExt })
    } catch (error) {
      return err(error)
    }
  }

  public async get(idExt: string): Promise<Failable<Option<ChatDTO>>> {
    try {
      const rows = await this.db.select().from(tableChats).where(eq(tableChats.idExt, idExt))
      const row = rows.at(0)
      return ok(row ? some(row) : none)
    } catch (error) {
      return err(error)
    }
  }

  public async createMessage(message: ChatMessageInsertDTO): Promise<Failable<{ id: number; idExt: string }>> {
    try {
      const [created] = await this.db.insert(tableChatMessages).values(message).returning()
      if (!created) return err('Failed to create message')
      return ok({ id: created.id, idExt: created.idExt })
    } catch (error) {
      return err(error)
    }
  }

  public async listMessages(chatIdExt: string): Promise<Failable<ChatMessageDTO[]>> {
    try {
      const [chatRow] = await this.db.select().from(tableChats).where(eq(tableChats.idExt, chatIdExt))
      if (!chatRow) return ok([])

      const rows = await this.db
        .select()
        .from(tableChatMessages)
        .where(eq(tableChatMessages.chatId, chatRow.id))
        .orderBy(asc(tableChatMessages.createdAt))

      return ok(rows)
    } catch (error) {
      return err(error)
    }
  }
}
