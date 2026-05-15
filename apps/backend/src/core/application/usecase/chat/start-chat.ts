import { type Failable, isErr, isNone, ok, val } from '@c3-oss/functional'
// 3rd-party
import type { Logger } from '@c3-oss/logger'

import type { ChatInsertDTO } from '~application/dto/index.js'
import type { ChatRepositoryPort, WorkspaceRepositoryPort } from '~application/port/index.js'
// internal
import { BaseUseCase } from '~application/usecase/base-usecase.js'

// ---------------------------------------------------------------------------------------------------------------------

export interface StartChatUseCaseDeps {
  chatRepository: ChatRepositoryPort
  workspaceRepository: WorkspaceRepositoryPort
  logger: Logger
}

export class StartChatUseCase extends BaseUseCase {
  private readonly chats: ChatRepositoryPort
  private readonly workspaces: WorkspaceRepositoryPort
  private readonly log: Logger

  public constructor(deps: StartChatUseCaseDeps) {
    super()
    const { chatRepository, workspaceRepository, logger } = deps
    this.invariant({ chatRepository, workspaceRepository, logger })
    this.chats = chatRepository
    this.workspaces = workspaceRepository
    this.log = logger.child({ usecase: 'StartChatUseCase' })
  }

  public async execute(params: { workspaceIdExt: string; title?: string }): Promise<Failable<{ idExt: string }>> {
    const { workspaceIdExt, title } = params
    this.log.debug({ workspaceIdExt, title }, 'start chat requested')

    const ws = await this.workspaces.get(workspaceIdExt)
    if (isErr(ws)) return ws
    const wsOpt = val(ws)
    if (isNone(wsOpt)) return ok({ idExt: '' })
    const row = wsOpt.value

    const payload: ChatInsertDTO = {
      workspaceId: row.id,
      title,
    }

    const created = await this.chats.create(payload)
    if (isErr(created)) return created
    return ok({ idExt: created.right.idExt })
  }
}
