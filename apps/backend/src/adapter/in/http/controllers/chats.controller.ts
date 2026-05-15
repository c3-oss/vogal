// c3
import { isErr, val } from '@c3-oss/functional'

// internal
import type { FastifyReply as Reply, FastifyRequest as Request } from 'fastify'
import { BaseController } from '~in/http/common/base-controller.js'
import {
  ChatIdExtParamsSchema,
  SendMessageBodySchema,
  StartChatBodySchema,
} from '~in/http/validators/chats.validators.js'
import type { Jsonifiable } from '~infra/contracts.js'
import { VErrorNotFound } from '~infra/errors/index.js'
import type { GetChatMessagesUseCase } from '~usecase/chat/get-messages.js'
import type { SendMessageUseCase } from '~usecase/chat/send-message.js'
import type { StartChatUseCase } from '~usecase/chat/start-chat.js'

// ---------------------------------------------------------------------------------------------------------------------

interface ChatsControllerDependencies {
  startChat: StartChatUseCase
  sendMessage: SendMessageUseCase
  getMessages: GetChatMessagesUseCase
}

export class ChatsController extends BaseController {
  private readonly startChat: StartChatUseCase
  private readonly sendMessage: SendMessageUseCase
  private readonly getMessages: GetChatMessagesUseCase

  public constructor(deps: ChatsControllerDependencies) {
    super()
    const { startChat, sendMessage, getMessages } = deps
    this.invariant({ startChat, sendMessage, getMessages })
    this.startChat = startChat
    this.sendMessage = sendMessage
    this.getMessages = getMessages
  }

  public async start(req: Request, reply: Reply): Promise<void> {
    const body = StartChatBodySchema.safeParse(req.body ?? {})
    if (!body.success) {
      throw body.error
    }
    const result = await this.startChat.execute({ workspaceIdExt: body.data.workspaceId, title: body.data.title })
    if (isErr(result)) {
      throw result.left
    }
    if (!val(result).idExt) {
      throw new VErrorNotFound({ message: 'Workspace not found' })
    }
    this.sendResponse(reply, 201, { id: val(result).idExt } as unknown as Jsonifiable)
  }

  public async postMessage(req: Request, reply: Reply): Promise<void> {
    const params = ChatIdExtParamsSchema.safeParse(req.params)
    if (!params.success) throw params.error
    const body = SendMessageBodySchema.safeParse(req.body ?? {})
    if (!body.success) throw body.error

    const result = await this.sendMessage.execute({ chatIdExt: params.data.chatIdExt, content: body.data.content })
    if (isErr(result)) throw result.left
    this.sendResponse(reply, 200, val(result) as unknown as Jsonifiable)
  }

  public async listMessages(req: Request, reply: Reply): Promise<void> {
    const params = ChatIdExtParamsSchema.safeParse(req.params)
    if (!params.success) throw params.error

    const result = await this.getMessages.execute({ chatIdExt: params.data.chatIdExt })
    if (isErr(result)) throw result.left

    this.sendResponse(reply, 200, val(result) as unknown as Jsonifiable)
  }
}
