// internal
import type { StorageProviderPort } from '~application/port/storage-provider.port.js'
import { env } from '~infra/config/env.js'
import { FirebaseStorageAdapter } from './firebase-storage.adapter.js'
import { S3StorageAdapter } from './s3-storage.adapter.js'

// ---------------------------------------------------------------------------------------------------------------------

let cachedProvider: StorageProviderPort | undefined

export const createStorageProvider = (): StorageProviderPort => {
  if (cachedProvider) {
    return cachedProvider
  }

  if (env.VOGAL_STORAGE_PROVIDER === 's3') {
    cachedProvider = new S3StorageAdapter({
      bucket: env.VOGAL_STORAGE_S3_BUCKET ?? '',
      region: env.VOGAL_STORAGE_S3_REGION,
      endpoint: env.VOGAL_STORAGE_S3_ENDPOINT,
      publicBaseUrl: env.VOGAL_STORAGE_S3_PUBLIC_BASE_URL,
      forcePathStyle: env.VOGAL_STORAGE_S3_FORCE_PATH_STYLE === 'true',
    })
    return cachedProvider
  }

  cachedProvider = new FirebaseStorageAdapter({
    projectId: env.VOGAL_STORAGE_FIREBASE_PROJECT_ID ?? '',
    clientEmail: env.VOGAL_STORAGE_FIREBASE_CLIENT_EMAIL ?? '',
    privateKey: env.VOGAL_STORAGE_FIREBASE_PRIVATE_KEY ?? '',
    bucket: env.VOGAL_STORAGE_FIREBASE_BUCKET ?? '',
  })

  return cachedProvider
}
