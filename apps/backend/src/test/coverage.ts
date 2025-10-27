// 3rd-party
import type { CoverageV8Options } from 'vitest/node'

// ---------------------------------------------------------------------------------------------------------------------

const nestedFilesGlob = (...filenames: string[]): string[] => filenames.map((f) => `**/**/${f}.+(ts|cts|mts)`)

export default {
  all: true,
  provider: 'v8',
  reportsDirectory: './coverage-e2e',
  reporter: ['text', 'json', 'html'],
  thresholds: {
    statements: 50,
    branches: 50,
    functions: 50,
    lines: 50,
  },
  exclude: [
    '*.cjs',
    '*.js',
    '*.mjs',
    'dist/**',
    'docs/**',
    'coverage/**',
    'src/test/**',
    'src/infra/config/env.ts',
    'src/adapter/out/db/pgconn.ts',
    'src/adapter/out/db/drizzle-schema.ts',
    'src/adapter/out/db/migration/**',
    'src/adapter/out/db/model/**',
    'src/infra/signal.ts',
    'src/adapter/in/shared/wiring.ts',
    ...nestedFilesGlob('*.config', '*.interface', '*.dto', '*.spec', '*.test', '*.port', 'inactive*', 'index'),
  ],
} as CoverageV8Options
