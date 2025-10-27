// 3rd-party
import { createEnv } from '@t3-oss/env-core'
import z from 'zod'

// ---------------------------------------------------------------------------------------------------------------------

const stringNumberEnv = (d: number) =>
  z
    .string()
    .default(d.toString())
    .transform((v: string) => {
      const n = Number(v)
      if (Number.isNaN(n)) {
        throw new Error(`Invalid number: ${v}`)
      }
      return n
    })

// ---------------------------------------------------------------------------------------------------------------------

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
    HTTP_PORT: stringNumberEnv(3000),
    HTTP_HOST: z.string().default('0.0.0.0'),
    HTTP_FILE_SIZE_LIMIT: stringNumberEnv(25 * 1024 * 1024), // 25MB
    HTTP_CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
    OPENAI_API_KEY: z.string().nonempty(),
    DATABASE_URL: z.string().startsWith('postgres'),
    QDRANT_URL: z.string().url().default('http://localhost:6333'),
    QDRANT_API_KEY: z.string().optional(),
    VOGAL_COLLECTION_NAME: z.string().default('documents'),
    VOGAL_EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
    VOGAL_NORMALIZATION_MODEL: z.string().default('gpt-4o-mini'),
    VOGAL_CHUNK_SIZE: stringNumberEnv(1000),
    VOGAL_CHUNK_OVERLAP: stringNumberEnv(200),
    REDIS_URL: z.string().url().optional(),
    VOGAL_STORAGE_PROVIDER: z.enum(['s3', 'firebase']).default('firebase'),
    VOGAL_STORAGE_S3_BUCKET: z.string().optional(),
    VOGAL_STORAGE_S3_REGION: z.string().optional(),
    VOGAL_STORAGE_S3_ENDPOINT: z.string().url().optional(),
    VOGAL_STORAGE_S3_PUBLIC_BASE_URL: z.string().url().optional(),
    VOGAL_STORAGE_S3_FORCE_PATH_STYLE: z.enum(['true', 'false']).optional(),
    VOGAL_STORAGE_FIREBASE_PROJECT_ID: z.string().optional(),
    VOGAL_STORAGE_FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
    VOGAL_STORAGE_FIREBASE_PRIVATE_KEY: z.string().optional(),
    VOGAL_STORAGE_FIREBASE_BUCKET: z.string().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})

// ---------------------------------------------------------------------------------------------------------------------

export const isProduction = env.NODE_ENV === 'production'
