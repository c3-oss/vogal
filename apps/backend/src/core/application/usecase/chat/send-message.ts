import { type Failable, err, isErr, isSome, ok, val } from '@c3-oss/functional'
// 3rd-party
import type { Logger } from '@c3-oss/logger'

import type { ChatRole } from '~application/dto/index.js'
import type { ChatLLMPort, ChatPlannerPort, ChatRepositoryPort, ChatToolPort } from '~application/port/index.js'
// internal
import { BaseUseCase } from '~application/usecase/base-usecase.js'

// ---------------------------------------------------------------------------------------------------------------------

export interface SendMessageUseCaseDeps {
  chatRepository: ChatRepositoryPort
  chatLLM: ChatLLMPort
  planner: ChatPlannerPort
  knowledgeTool: ChatToolPort
  logger: Logger
}

export class SendMessageUseCase extends BaseUseCase {
  private readonly chats: ChatRepositoryPort
  private readonly llm: ChatLLMPort
  private readonly planner: ChatPlannerPort
  private readonly knowledge: ChatToolPort
  private readonly log: Logger

  public constructor(deps: SendMessageUseCaseDeps) {
    super()
    const { chatRepository, chatLLM, planner, knowledgeTool, logger } = deps
    this.invariant({ chatRepository, chatLLM, planner, knowledgeTool, logger })
    this.chats = chatRepository
    this.llm = chatLLM
    this.planner = planner
    this.knowledge = knowledgeTool
    this.log = logger.child({ usecase: 'SendMessageUseCase' })
  }

  public async execute(params: { chatIdExt: string; content: string }): Promise<Failable<{ content: string }>> {
    const { chatIdExt, content } = params
    this.log.debug({ chatIdExt }, 'send message requested')

    const chatRow = await this.chats.get(chatIdExt)
    if (isErr(chatRow)) return chatRow
    const chatOption = val(chatRow)
    if (!isSome(chatOption)) return err('Chat not found')
    const chat = chatOption.value as { id: number; workspaceId: number }

    // 1) persist user message
    const createdUser = await this.chats.createMessage({ chatId: chat.id, role: 'user', content })
    if (isErr(createdUser)) return createdUser

    // 2) load history and plan
    const historyResult = await this.chats.listMessages(chatIdExt)
    if (isErr(historyResult)) return historyResult
    const history = historyResult.right.map((m) => ({ role: m.role as ChatRole, content: m.content }))
    const plan = await this.planner.plan(history)
    if (isErr(plan)) return plan

    // 3) tool call if needed
    let contextChunks: string[] = []
    if (plan.right?.tool?.name === 'search_knowledge') {
      const search = await this.knowledge.execute({
        workspaceIdExt: String(chat.workspaceId),
        query: plan.right.tool.args.query,
        limit: plan.right.tool.args.limit ?? 5,
      })
      if (isErr(search)) return search
      const { results } = search.right
      contextChunks = []
      const toolPayload = JSON.stringify({
        query: results.query,
        hits: results.results.slice(0, 5).map((r) => ({
          score: r.score,
          documentId: r.documentId,
          filename: r.filename,
          chunkIndex: r.chunkIndex,
        })),
      })
      await this.chats.createMessage({ chatId: chat.id, role: 'tool', content: toolPayload })
    }

    // 4) completion
    const completion = await this.llm.complete({
      workspaceIdExt: String(chat.workspaceId),
      messages: history.concat({ role: 'user', content }) as Array<{
        role: 'system' | 'user' | 'assistant' | 'tool'
        content: string
      }>,
      contextChunks,
    })
    if (isErr(completion)) return completion

    // 5) persist assistant
    await this.chats.createMessage({ chatId: chat.id, role: 'assistant', content: completion.right.content })
    return ok({ content: completion.right.content })
  }
}
