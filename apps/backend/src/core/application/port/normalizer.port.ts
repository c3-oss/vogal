// c3
import type { Failable } from '@c3-oss/functional'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Port for text normalization operations.
 */
export interface TextNormalizerPort {
  /** Normalizes text content for processing. */
  normalize(text: string): Promise<Failable<string>>
}
