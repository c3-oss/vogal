// c3
import type { Failable, Option } from '@c3-oss/functional'

export type StorageProvider = 's3' | 'firebase'

/**
 * Payload required to upload a file to an external storage service.
 */
export interface StorageUploadInput {
  /** External document identifier used to group files. */
  documentIdExt: string
  /** File name to be persisted. */
  filename: string
  /** MIME type associated with the file. */
  contentType: string
  /** Absolute path to the temporary file on disk. */
  localFilePath: string
}

/**
 * Result from uploading a file to storage.
 */
export interface StorageUploadResult {
  /** Storage provider handling the file. */
  provider: StorageProvider
  /** Bucket or container name where the file was stored. */
  bucket: string
  /** Object key or path within the bucket. */
  objectKey: string
  /** Public or retrievable URL to access the file. */
  url?: string
}

/**
 * Payload required to remove a previously uploaded file from storage.
 */
export interface StorageRemoveInput {
  /** Bucket or container name where the file resides. */
  bucket: string
  /** Object key or path within the bucket. */
  objectKey: string
}

/**
 * Abstraction for external storage services.
 */
export interface StorageProviderPort {
  upload(input: StorageUploadInput): Promise<Failable<StorageUploadResult>>
  remove(input: StorageRemoveInput): Promise<Option<Error>>
}
