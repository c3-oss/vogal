// standard
import path from 'node:path'

// 3rd-party
import dotenv from 'dotenv'

// internal
import { createDB, destroyDB } from '~test/pglite.js'

// ---------------------------------------------------------------------------------------------------------------------

let usePglite = false

export const setup = async () => {
  const rootDir = path.resolve(import.meta.dirname, '..', '..', '..')

  dotenv.config({
    path: ['.env.test', '.env.local', '.env'].map((p) => path.join(rootDir, p)),
    override: true,
  })

  if (!process.env.__USE_PGLITE) {
    return
  }

  const tmpPgdata = await createDB()
  process.env.__PGLITE_DATA_DIR = tmpPgdata
  usePglite = true

  console.log(`using temporary pgdata dir @ ${tmpPgdata}`)
  console.log('database initialized; setup complete')
}

export const teardown = async () => {
  if (!usePglite) {
    return
  }

  await destroyDB()
  console.log('temporary pgdata dir deleted')
}
