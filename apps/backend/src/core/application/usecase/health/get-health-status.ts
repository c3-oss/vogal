// 3rd-party
import { performance } from 'node:perf_hooks'
import { sql } from 'drizzle-orm'

// c3
import type { Logger } from '@c3-oss/logger'

import type { HealthStatusDTO } from '~application/dto/index.js'
// internal
import { BaseUseCase } from '~application/usecase/base-usecase.js'
import { env } from '~infra/config/env.js'
import type { DB } from '~out/db/pgconn.js'

type DatabaseExecutor = Pick<DB, 'execute'>

// ---------------------------------------------------------------------------------------------------------------------

export interface GetHealthStatusUseCaseDeps {
  db: DatabaseExecutor
  logger: Logger
  now?: () => Date
  uptime?: () => number
  memoryUsage?: () => NodeJS.MemoryUsage
  version?: string
}

export class GetHealthStatusUseCase extends BaseUseCase {
  private readonly db: DatabaseExecutor
  private readonly log: Logger
  private readonly now: () => Date
  private readonly uptime: () => number
  private readonly memoryUsage: () => NodeJS.MemoryUsage
  private readonly version: string

  public constructor(deps: GetHealthStatusUseCaseDeps) {
    super()

    const { db, logger, now, uptime, memoryUsage, version } = deps
    this.invariant({ db, logger })

    this.db = db
    this.log = logger.child({ usecase: 'GetHealthStatusUseCase' })
    this.now = now ?? (() => new Date())
    this.uptime = uptime ?? process.uptime
    this.memoryUsage = memoryUsage ?? process.memoryUsage
    this.version = version ?? process.env.npm_package_version ?? 'unknown'
  }

  /**
   * Executes health check for the application and its dependencies.
   * Performs database connectivity test and collects system metrics.
   *
   * @returns Promise resolving to comprehensive health status information
   */
  public async execute(): Promise<HealthStatusDTO> {
    const timestamp = this.now()
    const uptimeSeconds = Math.round(this.uptime())

    /* ... */

    const memory = this.memoryUsage()

    let overallStatus: HealthStatusDTO['status'] = 'ok'
    const database: HealthStatusDTO['dependencies']['database'] = { status: 'ok' }

    /* ... */

    try {
      const start = performance.now()
      await this.db.execute(sql`select 1`)
      const latency = performance.now() - start
      database.latencyMs = Number(latency.toFixed(2))
      this.log.debug({ latencyMs: database.latencyMs }, 'database healthcheck succeeded')
    } catch (err) {
      overallStatus = 'error'
      database.status = 'error'
      database.error = err instanceof Error ? err.message : 'unknown database error'
      this.log.warn({ error: database.error }, 'database healthcheck failed')
    }

    /* ... */

    return {
      status: overallStatus,
      timestamp: timestamp.toISOString(),
      uptimeSeconds,
      environment: env.NODE_ENV,
      version: this.version,
      dependencies: {
        database,
      },
      metrics: {
        memory: {
          rss: memory.rss,
          heapUsed: memory.heapUsed,
          heapTotal: memory.heapTotal,
          external: memory.external,
        },
      },
    }
  }
}
