import { LoggerBuilder } from '@c3-oss/logger'
import { exec } from '~adapter/in/server.js'
import { env } from '~infra/config/env.js'

export const main = async (): Promise<void> => {
  LoggerBuilder.init({
    env: env.NODE_ENV,
    logLevel: env.LOG_LEVEL,
  })

  const log = LoggerBuilder.buildChildLogger({ name: 'vogal' })
  log.info('Vogal online; loading server...')
  await exec(log)
}
