// 3rd-party
import type { Logger } from '@c3-oss/logger'

// internal - background
import { EventEmitterBackgroundStrategy } from '~adapter/out/background/event-emitter.strategy.js'

import { OpenAIChatPlanner } from '~out/ai/chat-planner.adapter.js'
import { OpenAIChatAdapter } from '~out/ai/chat.adapter.js'
// internal - adapters/out
import { OpenAIEmbedder } from '~out/ai/embeddings.adapter.js'
import { OpenAINormalizer } from '~out/ai/normalizer.adapter.js'
import { RedisCacheAdapter } from '~out/cache/redis.cache.adapter.js'
import { ChatRepository } from '~out/db/model/chat/chat.repository.js'
import { DocumentUploadRepository } from '~out/db/model/document-uploads/document-upload.repository.js'
import { DocumentWriteAdapter } from '~out/db/model/document/document-write.adapter.js'
import { DocumentRepository } from '~out/db/model/document/document.repository.js'
import { CachingUserRepository } from '~out/db/model/user/user.caching.repository.js'
import { UserRepository } from '~out/db/model/user/user.repository.js'
import { CachingWorkspaceRepository } from '~out/db/model/workspace/workspace.caching.repository.js'
import { WorkspaceRepository } from '~out/db/model/workspace/workspace.repository.js'
import { db } from '~out/db/pgconn.js'
import { createStorageProvider } from '~out/storage/index.js'
import { KnowledgeSearchTool } from '~out/tools/knowledge-search.tool.js'
import { CachingQdrantRepository } from '~out/vector-db/qdrant.caching.repository.js'
import { QdrantRepository } from '~out/vector-db/qdrant.repository.js'

// internal - infra
import { env } from '~infra/config/env.js'
import { parsePDF } from '~infra/pdf/pdf.parser.js'
import { chunkText } from '~infra/text-utils.js'

import { GetChatMessagesUseCase } from '~usecase/chat/get-messages.js'
import { SendMessageUseCase } from '~usecase/chat/send-message.js'
import { StartChatUseCase } from '~usecase/chat/start-chat.js'
// internal - use cases
import { ProcessPdfUseCase } from '~usecase/document/process-pdf.js'
import { SearchUseCase } from '~usecase/document/search.js'
import { UpdateDocumentUseCase } from '~usecase/document/update-document.js'
import { GetHealthStatusUseCase } from '~usecase/health/get-health-status.js'
import { CreateUserUseCase } from '~usecase/user/create-user.js'
import { DeleteUserUseCase } from '~usecase/user/delete-user.js'
import { GetUserUseCase } from '~usecase/user/get-user.js'
import { GetUsersUseCase } from '~usecase/user/get-users.js'
import { UpdateUserUseCase } from '~usecase/user/update-user.js'
import { CreateWorkspaceUseCase } from '~usecase/workspace/create-workspace.js'
import { DeleteWorkspaceUseCase } from '~usecase/workspace/delete-workspace.js'
import { GetWorkspaceUseCase } from '~usecase/workspace/get-workspace.js'
import { GetWorkspacesByUserUseCase } from '~usecase/workspace/get-workspaces-by-user.js'
import { GetWorkspacesUseCase } from '~usecase/workspace/get-workspaces.js'
import { UpdateWorkspaceUseCase } from '~usecase/workspace/update-workspace.js'

import { ChatsController } from '~in/http/controllers/chats.controller.js'
// internal - controllers
import { DocumentStatusController } from '~in/http/controllers/document-status.controller.js'
import { DocumentsController } from '~in/http/controllers/documents.controller.js'
import { HealthController } from '~in/http/controllers/health.controller.js'
import { SearchController } from '~in/http/controllers/search.controller.js'
import { UploadController } from '~in/http/controllers/upload.controller.js'
import { UsersController } from '~in/http/controllers/users.controller.js'
import { WorkspacesController } from '~in/http/controllers/workspaces.controller.js'

// ---------------------------------------------------------------------------------------------------------------------

export const initRepositories = (cache: RedisCacheAdapter | undefined, logger: Logger) => {
  const baseQdrantRepo = new QdrantRepository()
  const baseUserRepo = new UserRepository(db)
  const baseWorkspaceRepo = new WorkspaceRepository(db)
  const chatRepository = new ChatRepository(db)

  return {
    vectorRepository: cache ? new CachingQdrantRepository(baseQdrantRepo, cache) : baseQdrantRepo,
    userRepository: cache ? new CachingUserRepository(baseUserRepo, cache) : baseUserRepo,
    workspaceRepository: cache ? new CachingWorkspaceRepository(baseWorkspaceRepo, cache) : baseWorkspaceRepo,
    documentRepository: new DocumentRepository(db),
    uploadsRepository: new DocumentUploadRepository(db),
    chatRepository,
  }
}

export const initUseCases = (
  _cache: RedisCacheAdapter | undefined,
  repositories: ReturnType<typeof initRepositories>,
  logger: Logger,
) => {
  const embedder = new OpenAIEmbedder()
  const normalizer = new OpenAINormalizer()
  const writer = new DocumentWriteAdapter(db)

  const { vectorRepository, userRepository, workspaceRepository, documentRepository, chatRepository } = repositories

  const processor = new ProcessPdfUseCase({
    repository: vectorRepository,
    embedder,
    normalizer,
    writer,
    logger,
  })

  return {
    writer,
    processor,
    getHealthStatus: new GetHealthStatusUseCase({ db, logger }),
    search: new SearchUseCase({ embedder, repository: vectorRepository, logger }),
    updateDocument: new UpdateDocumentUseCase({ documentRepository, logger }),
    createUser: new CreateUserUseCase({ userRepository, logger }),
    getUser: new GetUserUseCase({ userRepository, logger }),
    getUsers: new GetUsersUseCase({ userRepository, logger }),
    deleteUser: new DeleteUserUseCase({ userRepository, logger }),
    updateUser: new UpdateUserUseCase({ userRepository, logger }),
    createWorkspace: new CreateWorkspaceUseCase({
      repository: vectorRepository,
      workspaceRepository,
      userRepository,
      logger,
    }),
    getWorkspace: new GetWorkspaceUseCase({ workspaceRepository, logger }),
    getWorkspaces: new GetWorkspacesUseCase({ workspaceRepository, logger }),
    getWorkspacesByUser: new GetWorkspacesByUserUseCase({ workspaceRepository, userRepository, logger }),
    deleteWorkspace: new DeleteWorkspaceUseCase({ workspaceRepository, repository: vectorRepository, logger }),
    updateWorkspace: new UpdateWorkspaceUseCase({ workspaceRepository, logger }),
    startChat: new StartChatUseCase({ chatRepository, workspaceRepository, logger }),
    sendMessage: new SendMessageUseCase({
      chatRepository,
      chatLLM: new OpenAIChatAdapter(),
      planner: new OpenAIChatPlanner(),
      knowledgeTool: new KnowledgeSearchTool(new SearchUseCase({ embedder, repository: vectorRepository, logger })),
      logger,
    }),
    getChatMessages: new GetChatMessagesUseCase({ chatRepository, logger }),
  }
}

export const initBackgroundProcessing = (
  logger: Logger,
  repositories: ReturnType<typeof initRepositories>,
  writer: DocumentWriteAdapter,
  processor: ProcessPdfUseCase,
  storageProvider: ReturnType<typeof createStorageProvider>,
) => {
  return new EventEmitterBackgroundStrategy({
    uploads: repositories.uploadsRepository,
    writer,
    storage: storageProvider,
    processor,
    vectorRepository: repositories.vectorRepository,
    parsePdf: parsePDF,
    chunkText,
    chunkSize: env.VOGAL_CHUNK_SIZE,
    chunkOverlap: env.VOGAL_CHUNK_OVERLAP,
    logger: logger.child({ layer: 'background' }),
  })
}

export const initControllers = (
  useCases: ReturnType<typeof initUseCases>,
  repositories: ReturnType<typeof initRepositories>,
  background: EventEmitterBackgroundStrategy,
) => {
  const {
    getHealthStatus,
    search,
    updateDocument,
    writer,
    createUser,
    getUser,
    getUsers,
    deleteUser,
    updateUser,
    createWorkspace,
    getWorkspace,
    getWorkspaces,
    getWorkspacesByUser,
    deleteWorkspace,
    updateWorkspace,
    startChat,
    sendMessage,
    getChatMessages,
  } = useCases

  const { vectorRepository, uploadsRepository } = repositories

  const healthController = new HealthController({ getHealthStatus })
  const uploadController = new UploadController({
    writer,
    background,
    getWorkspace,
  })
  const searchController = new SearchController({ search })
  const documentsController = new DocumentsController({ repository: vectorRepository, updateDocument })
  const documentStatusController = new DocumentStatusController({ uploads: uploadsRepository })

  const usersController = new UsersController({
    createUser,
    getUser,
    getUsers,
    deleteUser,
    updateUser,
  })

  const workspacesController = new WorkspacesController({
    createWorkspace,
    getWorkspace,
    getWorkspaces,
    getWorkspacesByUser,
    deleteWorkspace,
    updateWorkspace,
  })

  const chatsController = new ChatsController({
    startChat,
    sendMessage,
    getMessages: getChatMessages,
  })

  return {
    healthController,
    uploadController,
    searchController,
    documentsController,
    documentStatusController,
    usersController,
    workspacesController,
    chatsController,
  }
}

export type WiringContext = {
  cache?: RedisCacheAdapter
  repositories: ReturnType<typeof initRepositories>
  useCases: ReturnType<typeof initUseCases>
  background: EventEmitterBackgroundStrategy
  controllers: ReturnType<typeof initControllers>
}

export const buildContext = async (log: Logger): Promise<WiringContext> => {
  const usecaseLogger = log.child({ layer: 'usecase' })
  const cache = env.REDIS_URL ? new RedisCacheAdapter({ url: env.REDIS_URL, logger: usecaseLogger }) : undefined
  if (cache) {
    await cache.connect()
  }

  const repositories = initRepositories(cache, usecaseLogger)
  const useCases = initUseCases(cache, repositories, usecaseLogger)
  const storage = createStorageProvider()
  const background = initBackgroundProcessing(log, repositories, useCases.writer, useCases.processor, storage)
  const controllers = initControllers(useCases, repositories, background)

  return { cache, repositories, useCases, background, controllers }
}
