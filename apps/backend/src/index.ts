import { main } from './main.js'

export type { AppRouter } from './adapter/in/trpc/index.js'
export type { Server } from './adapter/in/server.types.js'

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
