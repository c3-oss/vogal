// standard
import { EventEmitter } from 'node:events'

// ---------------------------------------------------------------------------------------------------------------------

// Simple singleton event bus for local background processing
class EventBus extends EventEmitter {}

export const eventBus = new EventBus()
