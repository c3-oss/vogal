// c3
import type { Failable } from '@c3-oss/functional'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Port for text embedding operations.
 */
export interface EmbedderPort {
  /** Generates vector embeddings for multiple text inputs. */
  embedMany(texts: string[]): Promise<Failable<number[][]>>
}
