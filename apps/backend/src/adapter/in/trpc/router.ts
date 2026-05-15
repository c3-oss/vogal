// 3rd-party
import { initTRPC } from '@trpc/server'
import superjson from 'superjson'

import { chatsRouter } from './procedures/chats.js'
// internal
import { documentsRouter } from './procedures/documents.js'
import { healthRouter } from './procedures/health.js'
import { searchRouter } from './procedures/search.js'
import { uploadRouter } from './procedures/upload.js'
import { usersRouter } from './procedures/users.js'
import { workspacesRouter } from './procedures/workspaces.js'
import type { RouterDeps } from './types.js'

// ---------------------------------------------------------------------------------------------------------------------

export function createAppRouter(deps: RouterDeps) {
  const t = initTRPC.context<Record<string, never>>().create({ transformer: superjson })

  return t.router({
    health: healthRouter(deps),
    search: searchRouter(deps),
    documents: documentsRouter(deps),
    upload: uploadRouter(deps),
    users: usersRouter(deps),
    workspaces: workspacesRouter(deps),
    chats: chatsRouter(deps),
  })
}

export type AppRouter = ReturnType<typeof createAppRouter>
