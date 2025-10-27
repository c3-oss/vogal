import * as dotenv from 'dotenv'
import type { Config } from 'drizzle-kit'

const __USE_PGLITE = process.env.__USE_PGLITE !== undefined

dotenv.config({ path: '.env' })
dotenv.config({ path: `.env.${process.env.NODE_ENV ?? 'local'}`, override: true })

const { env } = require('./src/infra/config/env')

export default {
  schema: './src/adapter/out/db/drizzle-schema.ts',
  out: './src/adapter/out/db/migration/pg',
  dialect: 'postgresql',
  verbose: true,
  strict: true,

  // ...
  driver: __USE_PGLITE ? 'pglite' : undefined,
  dbCredentials: {
    url: __USE_PGLITE ? './pgdata' : env.DATABASE_URL,
  },
} satisfies Config
