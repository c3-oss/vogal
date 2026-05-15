import type { Failable } from '@c3-oss/functional'
// 3rd-party
import type { Logger } from '@c3-oss/logger'

import type { ChatMessageDTO } from '~application/dto/index.js'
import type { ChatRepositoryPort } from '~application/port/index.js'
// internal
import { BaseUseCase } from '~application/usecase/base-usecase.js'

// ---------------------------------------------------------------------------------------------------------------------

export interface GetChatMessagesUseCaseDeps {
  chatRepository: ChatRepositoryPort
  logger: Logger
}

export class GetChatMessagesUseCase extends BaseUseCase {
  private readonly chats: ChatRepositoryPort
  private readonly log: Logger

  public constructor(deps: GetChatMessagesUseCaseDeps) {
    super()
    const { chatRepository, logger } = deps
    this.invariant({ chatRepository, logger })
    this.chats = chatRepository
    this.log = logger.child({ usecase: 'GetChatMessagesUseCase' })
  }

  public async execute(params: { chatIdExt: string }): Promise<Failable<ChatMessageDTO[]>> {
    const { chatIdExt } = params
    this.log.debug({ chatIdExt }, 'list chat messages requested')
    return this.chats.listMessages(chatIdExt)
  }
}
