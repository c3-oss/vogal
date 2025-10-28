// c3
import type { Failable } from '@c3-oss/functional'

// internal
import type { Matrix } from '~infra/contracts.js'

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Port for text embedding operations.
 */
export interface EmbedderPort {
  /** Generates vector embeddings for multiple text inputs. */
  embedMany(texts: string[]): Promise<Failable<Matrix<number>>>
}
