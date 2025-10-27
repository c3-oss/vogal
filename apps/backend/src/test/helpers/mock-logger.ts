// 3rd-party
import { vi } from 'vitest'

// c3
import type { Logger } from '@c3-oss/logger'

// ---------------------------------------------------------------------------------------------------------------------

export const createMockLogger = (): Logger => {
  const childMock = vi.fn()

  const logger = {
    child: childMock,
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    level: 'debug',
  }

  childMock.mockReturnValue(logger)

  return logger as unknown as Logger
}
