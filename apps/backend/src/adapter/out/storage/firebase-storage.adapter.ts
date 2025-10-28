// 3rd-party
import { Storage, type StorageOptions } from '@google-cloud/storage'

// c3
import { type Failable, type Option, err, none, ok, some } from '@c3-oss/functional'

// internal
import { BaseAdapter } from '~adapter/shared/base-adapter.js'
import type {
  StorageProviderPort,
  StorageRemoveInput,
  StorageUploadInput,
  StorageUploadResult,
} from '~application/port/storage-provider.port.js'
import { createGenericBreaker } from '~infra/circuit-breaker.js'
import { VErrorExternalServiceUnavailable, VErrorInvalidState } from '~infra/errors/index.js'

// ---------------------------------------------------------------------------------------------------------------------

export interface FirebaseStorageConfig {
  projectId: string
  clientEmail: string
  privateKey: string
  bucket: string
}

const buildObjectKey = (input: StorageUploadInput): string =>
  ['documents', input.documentIdExt, input.filename].map(encodeURIComponent).join('/')

const buildPublicUrl = (bucket: string, objectKey: string): string =>
  `https://storage.googleapis.com/${bucket}/${objectKey}`

export class FirebaseStorageAdapter extends BaseAdapter implements StorageProviderPort {
  private readonly bucketName: string
  private readonly storage: Storage
  private readonly circuitBreaker

  public constructor(config: FirebaseStorageConfig) {
    super()
    this.invariant(config)
    if (!config.projectId || !config.clientEmail || !config.privateKey || !config.bucket) {
      throw new VErrorInvalidState({ message: 'Missing Firebase storage configuration' })
    }

    this.bucketName = config.bucket
    const sanitizedKey = config.privateKey.replace(/\n/g, '\n')

    const options: StorageOptions = {
      projectId: config.projectId,
      credentials: {
        client_email: config.clientEmail,
        private_key: sanitizedKey,
      },
    }

    this.storage = new Storage(options)
    this.circuitBreaker = createGenericBreaker()
  }

  public async upload(input: StorageUploadInput): Promise<Failable<StorageUploadResult>> {
    const objectKey = buildObjectKey(input)
    const bucket = this.storage.bucket(this.bucketName)

    try {
      await this.circuitBreaker.fire(() =>
        bucket.upload(input.localFilePath, {
          destination: objectKey,
          contentType: input.contentType,
          resumable: false,
        }),
      )

      return ok({
        provider: 'firebase' as const,
        bucket: this.bucketName,
        objectKey,
        url: buildPublicUrl(this.bucketName, objectKey),
      })
    } catch (error) {
      return err(
        new VErrorExternalServiceUnavailable({
          message: 'Failed to upload file to Firebase storage',
          context: {
            documentIdExt: input.documentIdExt,
            reason: error instanceof Error ? error.message : String(error),
          },
        }),
      )
    }
  }

  public async remove(input: StorageRemoveInput): Promise<Option<Error>> {
    try {
      await this.circuitBreaker.fire(() =>
        this.storage.bucket(this.bucketName).file(input.objectKey).delete({ ignoreNotFound: true }),
      )
      return none
    } catch (error) {
      return some(
        new VErrorExternalServiceUnavailable({
          message: 'Failed to remove file from Firebase storage',
          context: {
            bucket: this.bucketName,
            objectKey: input.objectKey,
            reason: error instanceof Error ? error.message : String(error),
          },
        }),
      )
    }
  }
}
