/// <reference types="vitest" />
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

import coverage from './src/test/coverage.js'

export default defineConfig({
  test: {
    include: ['./src/**/__tests__/*.ts'],
    globalSetup: './src/test/unit/setup.ts',
    environment: 'node',
    globals: true,
    coverage,
  },
  plugins: [tsconfigPaths()],
})
