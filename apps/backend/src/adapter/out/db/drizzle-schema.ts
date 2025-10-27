// this file should be considered as CommonJS

// standard
import path from 'node:path'

// 3rd-party
import glob from 'fast-glob'

// ---------------------------------------------------------------------------------------------------------------------

const relp = './model'
const cwd = path.resolve(__dirname, relp)

module.exports = glob
  .sync('**/*.schema.ts', { onlyFiles: true, cwd })
  .map((m: string) => m.replace(/\.ts$/, ''))
  .map((m: string) => path.join(cwd, m))
  .map((m: string) => require(m))
  // biome-ignore lint/performance/noAccumulatingSpread: only used to generate/apply migrations
  .reduce((acc: Record<string, unknown>, m: Record<string, unknown>) => ({ ...acc, ...m }), {})
