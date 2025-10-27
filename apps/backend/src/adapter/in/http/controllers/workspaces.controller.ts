// 3rd-party
import type { FastifyReply as Reply, FastifyRequest as Request } from 'fastify'
import _ from 'lodash'

// c3
import { isErr, isNone, isSome, val } from '@c3-oss/functional'

// internal
import { BaseController } from '~/adapter/in/http/common/base-controller.js'
import { VErrorNotFound } from '~/infra/errors/index.js'
import type { PaginationQueryDTO, WorkspaceDTO } from '~application/dto/index.js'
import type { Jsonifiable } from '~infra/contracts.js'
import type { CreateWorkspaceUseCase } from '~usecase/workspace/create-workspace.js'
import type { DeleteWorkspaceUseCase } from '~usecase/workspace/delete-workspace.js'
import type { GetWorkspaceUseCase } from '~usecase/workspace/get-workspace.js'
import type { GetWorkspacesByUserUseCase } from '~usecase/workspace/get-workspaces-by-user.js'
import type { GetWorkspacesUseCase } from '~usecase/workspace/get-workspaces.js'
import type { UpdateWorkspaceUseCase } from '~usecase/workspace/update-workspace.js'
import {
  CreateWorkspaceBodySchema,
  ListWorkspacesQuerySchema,
  UpdateWorkspaceBodySchema,
  UserIdParamsSchema,
  WorkspaceIdExtParamsSchema,
} from '~validators/workspaces.validators.js'

// ---------------------------------------------------------------------------------------------------------------------

interface WorkspacesControllerDependencies {
  createWorkspace: CreateWorkspaceUseCase
  getWorkspace: GetWorkspaceUseCase
  getWorkspaces: GetWorkspacesUseCase
  getWorkspacesByUser: GetWorkspacesByUserUseCase
  deleteWorkspace: DeleteWorkspaceUseCase
  updateWorkspace: UpdateWorkspaceUseCase
}

export class WorkspacesController extends BaseController {
  private readonly createWorkspace: CreateWorkspaceUseCase
  private readonly getWorkspace: GetWorkspaceUseCase
  private readonly getWorkspaces: GetWorkspacesUseCase
  private readonly getWorkspacesByUser: GetWorkspacesByUserUseCase
  private readonly deleteWorkspace: DeleteWorkspaceUseCase
  private readonly updateWorkspace: UpdateWorkspaceUseCase

  public constructor(deps: WorkspacesControllerDependencies) {
    super()

    const { createWorkspace, getWorkspace, getWorkspaces, getWorkspacesByUser, deleteWorkspace, updateWorkspace } = deps
    this.invariant({
      createWorkspace,
      getWorkspace,
      getWorkspaces,
      getWorkspacesByUser,
      deleteWorkspace,
      updateWorkspace,
    })

    this.createWorkspace = createWorkspace
    this.getWorkspace = getWorkspace
    this.getWorkspaces = getWorkspaces
    this.getWorkspacesByUser = getWorkspacesByUser
    this.deleteWorkspace = deleteWorkspace
    this.updateWorkspace = updateWorkspace
  }

  private filterWorkspaceData(workspace: WorkspaceDTO): Jsonifiable {
    return { id: workspace.idExt, ..._.pick(workspace, ['name']) }
  }

  public async create(req: Request, reply: Reply): Promise<void> {
    const parsed = CreateWorkspaceBodySchema.safeParse(req.body)
    if (!parsed.success) {
      throw parsed.error
    }

    /* ... */

    const idResult = await this.createWorkspace.execute(parsed.data)
    if (isErr(idResult)) {
      throw idResult.left
    }

    this.sendResponse(reply, 201, { id: idResult.right })
  }

  public async getAll(req: Request, reply: Reply): Promise<void> {
    const parsed = ListWorkspacesQuerySchema.safeParse(req.query ?? {})
    if (!parsed.success) {
      throw parsed.error
    }

    /* ... */

    const { orderField, orderDirection, limit, page } = parsed.data as PaginationQueryDTO
    const result = await this.getWorkspaces.execute({ limit, page, orderField, orderDirection })
    if (isErr(result)) {
      throw result.left
    }

    const { meta, items } = val(result)
    this.sendResponse(reply, 200, {
      meta,
      items: items.map(this.filterWorkspaceData),
    } as unknown as Jsonifiable)
  }

  public async getOne(req: Request, reply: Reply): Promise<void> {
    const parsed = WorkspaceIdExtParamsSchema.safeParse(req.params)
    if (!parsed.success) {
      throw parsed.error
    }

    /* ... */

    const workspaceResult = await this.getWorkspace.execute(parsed.data)
    if (isErr(workspaceResult)) {
      throw workspaceResult.left
    }
    const workspaceOption = val(workspaceResult)

    if (isNone(workspaceOption)) {
      throw new VErrorNotFound({ message: 'Workspace not found' })
    }

    this.sendResponse(reply, 200, this.filterWorkspaceData(workspaceOption.value))
  }

  public async getByUser(req: Request, reply: Reply): Promise<void> {
    const parsed = UserIdParamsSchema.safeParse(req.params)
    if (!parsed.success) {
      throw parsed.error
    }

    /* ... */

    const result = await this.getWorkspacesByUser.execute(parsed.data)
    if (isErr(result)) {
      throw result.left
    }
    const workspaces = val(result)

    this.sendResponse(reply, 200, { workspaces: workspaces.map(this.filterWorkspaceData) })
  }

  public async delete(req: Request, reply: Reply): Promise<void> {
    const parsed = WorkspaceIdExtParamsSchema.safeParse(req.params)
    if (!parsed.success) {
      throw parsed.error
    }

    /* ... */

    const result = await this.deleteWorkspace.execute(parsed.data)
    if (isSome(result)) {
      throw result.value
    }

    this.sendResponse(reply, 204)
  }

  public async update(req: Request, reply: Reply): Promise<void> {
    const params = WorkspaceIdExtParamsSchema.safeParse(req.params)
    if (!params.success) {
      throw params.error
    }

    /* ... */

    const body = UpdateWorkspaceBodySchema.safeParse(req.body ?? {})
    if (!body.success) {
      throw body.error
    }

    /* ... */

    const result = await this.updateWorkspace.execute({ idExt: params.data.idExt, ...body.data })
    if (isErr(result)) {
      throw result.left
    }

    this.sendResponse(reply, 200, this.filterWorkspaceData(val(result)))
  }
}
