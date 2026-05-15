// 3rd-party
import { z } from 'zod'

// ---------------------------------------------------------------------------------------------------------------------

export const StartChatBodySchema = z.object({
  workspaceId: z.string().min(1),
  title: z.string().min(1).optional(),
})

export const ChatIdExtParamsSchema = z.object({
  chatIdExt: z.string().min(1),
})

export const SendMessageBodySchema = z.object({
  content: z.string().min(1),
})
