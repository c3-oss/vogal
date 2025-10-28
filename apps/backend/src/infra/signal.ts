export type Action = () => Promise<void>

interface RunBeforeExitOptions {
  actions: Action[]
  signals?: string[]
  forceShutdownTimeout?: number
}

// ---------------------------------------------------------------------------------------------------------------------

let hasReceivedInterruptionSignal = false

const forceExitAfterTimeout = (p: { forceShutdownTimeout?: number }) => {
  const { forceShutdownTimeout = 20 } = p
  const timeoutCallback = () => {
    console.error(`Could not gracefully shutdown after ${forceShutdownTimeout} seconds; forcing exit`)
    process.exit(1)
  }

  setTimeout(timeoutCallback, forceShutdownTimeout * 1000).unref()
}

const runActions = async (p: { actions: Action[] }) => {
  const { actions } = p

  const retryableActions = actions.map(async (action) => {
    try {
      await action()
      return { action, hasCompleted: true }
    } catch {
      return { action, hasCompleted: false }
    }
  })

  const executions = await Promise.all(retryableActions)

  const uncompletedActions = executions.filter((exec) => !exec.hasCompleted)
  if (uncompletedActions.length > 0) {
    console.warn(`${uncompletedActions.length} closing action(s) failed to complete; trying again...`)
    return await runActions({
      actions: uncompletedActions.map((a) => a.action),
    })
  }

  console.debug('All closing actions completed')
  return null
}

// ---------------------------------------------------------------------------------------------------------------------

export const runBeforeExit = (options: RunBeforeExitOptions) => {
  const { actions, signals = ['SIGINT', 'SIGTERM', 'SIGHUP'] } = options

  for (const signal of signals) {
    process.on(signal, () => {
      if (actions.length === 0) {
        console.log('got SIGNAL; exiting now')
        process.exit(0)
      }

      if (hasReceivedInterruptionSignal) {
        console.warn('program is already shutting down...')
        return
      }

      console.log('got SIGNAL; gracefully shutting down...')
      hasReceivedInterruptionSignal = true
      forceExitAfterTimeout({})

      runActions({ actions }).finally(() => process.exit(0))
    })
  }
}
