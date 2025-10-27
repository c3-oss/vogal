// c3
import type { Logger } from '@c3-oss/logger'

// internal
import type { WiringContext } from '~in/shared/wiring.js'

// ---------------------------------------------------------------------------------------------------------------------

export type RouterDeps = Pick<WiringContext, 'useCases' | 'repositories' | 'background'> & { log: Logger }
