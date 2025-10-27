/// <reference types="vitest" />
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

import coverage from './src/test/coverage.js'

export default defineConfig({
  test: {
    include: ['./src/test/e2e/e2e.spec.ts'],
    globalSetup: './src/test/e2e/setup.ts',
    environment: 'node',
    bail: 1,
    globals: true,
    sequence: {
      concurrent: false,
    },
    coverage,
  },
  plugins: [tsconfigPaths()],
})
