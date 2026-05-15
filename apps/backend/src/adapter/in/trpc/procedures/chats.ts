// 3rd-party
import { initTRPC } from '@trpc/server'

// internal
import {
  ChatIdExtParamsSchema,
  SendMessageBodySchema,
  StartChatBodySchema,
} from '~in/http/validators/chats.validators.js'
import { rightOrThrow } from '../trpc-errors.js'
import type { RouterDeps } from '../types.js'

// ---------------------------------------------------------------------------------------------------------------------

const t = initTRPC.context<Record<string, never>>().create()

export const chatsRouter = (deps: RouterDeps) =>
  t.router({
    start: t.procedure.input(StartChatBodySchema).mutation(async ({ input }) => {
      const id = await deps.useCases.startChat.execute({ workspaceIdExt: input.workspaceId, title: input.title })
      return rightOrThrow(id)
    }),

    sendMessage: t.procedure.input(ChatIdExtParamsSchema.and(SendMessageBodySchema)).mutation(async ({ input }) => {
      const res = await deps.useCases.sendMessage.execute({ chatIdExt: input.chatIdExt, content: input.content })
      return rightOrThrow(res)
    }),

    getMessages: t.procedure.input(ChatIdExtParamsSchema).query(async ({ input }) => {
      const res = await deps.useCases.getChatMessages.execute({ chatIdExt: input.chatIdExt })
      return rightOrThrow(res)
    }),
  })
