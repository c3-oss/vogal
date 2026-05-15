// internal
import type { Server } from '~adapter/in/server.types.js'
import type { WiringContext } from '~adapter/in/shared/wiring.js'

// ---------------------------------------------------------------------------------------------------------------------

export const createHTTPRouter = (ctx: WiringContext) => (app: Server) => {
  const {
    healthController,
    uploadController,
    searchController,
    documentsController,
    documentStatusController,
    usersController,
    workspacesController,
    chatsController,
  } = ctx.controllers

  app.post('/upload', uploadController.handle.bind(uploadController))
  app.get('/search', searchController.handle.bind(searchController))
  app.get('/documents', documentsController.handle.bind(documentsController))
  app.put('/documents/:idExt', documentsController.update.bind(documentsController))
  app.get('/documents/:idExt/status', documentStatusController.handle.bind(documentStatusController))
  app.post('/users', usersController.create.bind(usersController))
  app.get('/users', usersController.getAll.bind(usersController))
  app.get('/users/:idExt', usersController.getOne.bind(usersController))
  app.put('/users/:idExt', usersController.update.bind(usersController))
  app.delete('/users/:idExt', usersController.delete.bind(usersController))
  app.post('/workspaces', workspacesController.create.bind(workspacesController))
  app.get('/workspaces', workspacesController.getAll.bind(workspacesController))
  app.get('/workspaces/:idExt', workspacesController.getOne.bind(workspacesController))
  app.get('/users/:userId/workspaces', workspacesController.getByUser.bind(workspacesController))
  app.put('/workspaces/:idExt', workspacesController.update.bind(workspacesController))
  app.delete('/workspaces/:idExt', workspacesController.delete.bind(workspacesController))
  app.post('/workspaces/:workspaceId/chats', chatsController.start.bind(chatsController))
  app.post('/chats/:chatIdExt/messages', chatsController.postMessage.bind(chatsController))
  app.get('/chats/:chatIdExt/messages', chatsController.listMessages.bind(chatsController))
  app.get('/', healthController.handle.bind(healthController))
}
