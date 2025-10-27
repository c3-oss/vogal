// 3rd-party
import { describe, expect, it } from 'vitest'

// internal
import { eventBus } from '../event-bus.js'

// ---------------------------------------------------------------------------------------------------------------------

describe('eventBus', () => {
  it('should emit and receive events', async () => {
    const payload = { x: 1 }
    const received = new Promise<any>((resolve) => eventBus.once('test', resolve))
    eventBus.emit('test', payload)
    expect(await received).toEqual(payload)
  })
})
