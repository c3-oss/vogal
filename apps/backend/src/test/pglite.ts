// standard
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

// 3rd-party
import { PGlite } from '@electric-sql/pglite'
import { vector } from '@electric-sql/pglite-pgvector'
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'

// internal
import * as schema from '~adapter/out/db/model/schema.js'
import type { DB } from '~adapter/out/db/pgconn.js'

// ---------------------------------------------------------------------------------------------------------------------

export let db: DB
let tmpPgdata: string

export const createDB = async (): Promise<string> => {
  tmpPgdata = await fs.mkdtemp(path.join(os.tmpdir(), 'rag-test-pgdata-'))

  db = drizzlePglite({
    schema,
    client: new PGlite(tmpPgdata, {
      extensions: { vector },
    }),
  })

  await migrate(db, {
    migrationsFolder: path.resolve(import.meta.dirname, '..', 'adapter', 'out', 'db', 'migration', 'pg'),
  })

  return tmpPgdata
}

export const destroyDB = async (): Promise<void> => {
  if (tmpPgdata) {
    await fs.rm(tmpPgdata, { recursive: true })
  }
}
