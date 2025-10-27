// ---------------------------------------------------------------------------------------------------------------------

/**
 * Status information for external dependencies.
 */
export interface HealthDependencyStatusDTO {
  /** Current status of the dependency. */
  status: 'ok' | 'error'
  /** Response latency in milliseconds. */
  latencyMs?: number
  /** Error message if status is 'error'. */
  error?: string
}

/**
 * Overall health status of the application.
 */
export interface HealthStatusDTO {
  /** Overall health status. */
  status: 'ok' | 'degraded' | 'error'
  /** ISO timestamp of the health check. */
  timestamp: string
  /** Application uptime in seconds. */
  uptimeSeconds: number
  /** Deployment environment name. */
  environment: string
  /** Application version. */
  version: string
  /** Status of external dependencies. */
  dependencies: {
    database: HealthDependencyStatusDTO
  }
  /** Runtime metrics. */
  metrics: {
    memory: {
      /** Resident Set Size in bytes. */
      rss: number
      /** Heap memory used in bytes. */
      heapUsed: number
      /** Total heap memory allocated in bytes. */
      heapTotal: number
      /** External memory used in bytes. */
      external: number
    }
  }
}
