// 3rd-party
import { PGlite } from '@electric-sql/pglite'
import { vector } from '@electric-sql/pglite-pgvector'
import { drizzle as drizzlePostgres } from 'drizzle-orm/node-postgres'
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite'
import { Pool } from 'pg'

// internal
import * as schema from '~/adapter/out/db/model/schema.js'
import { env, isProduction } from '~infra/config/env.js'

// ---------------------------------------------------------------------------------------------------------------------

const __USE_PGLITE = process.env.__USE_PGLITE !== undefined
const __PGLITE_DATA_DIR = process.env.__PGLITE_DATA_DIR ?? './pgdata'

export const db = __USE_PGLITE
  ? drizzlePglite({
      schema,
      client: new PGlite(__PGLITE_DATA_DIR, {
        extensions: { vector },
      }),
      logger: isProduction,
    })
  : drizzlePostgres({
      schema,
      client: new Pool({
        connectionString: env.DATABASE_URL,
        max: isProduction ? 10 : 1,
        ...(isProduction && {
          ssl: { rejectUnauthorized: false },
        }),
      }),
      logger: isProduction,
    })

export type DB = typeof db
export type DBTransaction = Parameters<Parameters<DB['transaction']>[0]>[0]
export type DBClient = DB | DBTransaction
