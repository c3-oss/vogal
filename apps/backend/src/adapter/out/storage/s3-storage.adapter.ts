// standard
import { createReadStream } from 'node:fs'

// 3rd-party
import { DeleteObjectCommand, PutObjectCommand, S3Client, type S3ClientConfig } from '@aws-sdk/client-s3'

// c3
import { type Failable, type Option, err, none, ok, some } from '@c3-oss/functional'

import { BaseAdapter } from '~adapter/shared/base-adapter.js'
// internal
import type {
  StorageProviderPort,
  StorageRemoveInput,
  StorageUploadInput,
  StorageUploadResult,
} from '~application/port/storage-provider.port.js'
import { VErrorExternalServiceUnavailable, VErrorInvalidState } from '~infra/errors/index.js'

// ---------------------------------------------------------------------------------------------------------------------

export interface S3StorageConfig {
  bucket: string
  region?: string
  endpoint?: string
  publicBaseUrl?: string
  forcePathStyle?: boolean
}

const buildObjectKey = (input: StorageUploadInput): string =>
  ['documents', input.documentIdExt, input.filename].map(encodeURIComponent).join('/')

const buildPublicUrl = (config: S3StorageConfig, objectKey: string): string | undefined => {
  if (config.publicBaseUrl) {
    return `${config.publicBaseUrl.replace(/\/+$/, '')}/${objectKey}`
  }

  if (!config.region) {
    return undefined
  }

  return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${objectKey}`
}

const createClient = (config: S3StorageConfig): S3Client => {
  if (!config.bucket) {
    throw new VErrorInvalidState({ message: 'Missing S3 bucket configuration' })
  }

  if (!config.region && !config.endpoint) {
    throw new VErrorInvalidState({ message: 'S3 storage requires region or endpoint configuration' })
  }

  const clientConfig: S3ClientConfig = {
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
  }

  return new S3Client(clientConfig)
}

export class S3StorageAdapter extends BaseAdapter implements StorageProviderPort {
  private readonly client: S3Client
  private readonly config: S3StorageConfig

  public constructor(config: S3StorageConfig) {
    super()
    this.invariant(config.bucket, { errorMessage: 'S3 bucket is required' })
    this.client = createClient(config)
    this.config = config
  }

  public async upload(input: StorageUploadInput): Promise<Failable<StorageUploadResult>> {
    const objectKey = buildObjectKey(input)

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.config.bucket,
          Key: objectKey,
          Body: createReadStream(input.localFilePath),
          ContentType: input.contentType,
        }),
      )

      return ok({
        provider: 's3' as const,
        bucket: this.config.bucket,
        objectKey,
        url: buildPublicUrl(this.config, objectKey),
      })
    } catch (error) {
      return err(
        new VErrorExternalServiceUnavailable({
          message: 'Failed to upload file to S3 storage',
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
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: input.bucket,
          Key: input.objectKey,
        }),
      )
      return none
    } catch (error) {
      return some(
        new VErrorExternalServiceUnavailable({
          message: 'Failed to remove file from S3 storage',
          context: {
            bucket: input.bucket,
            objectKey: input.objectKey,
            reason: error instanceof Error ? error.message : String(error),
          },
        }),
      )
    }
  }
}
