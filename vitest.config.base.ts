import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    // Resolve the workspace packages to their sources, like the paths in tsconfig.json
    alias: [{ find: /^@credo-ts\/didcomm-([^/]+)$/, replacement: path.resolve(__dirname, 'packages/$1/src') }],
  },
  test: {
    globals: true,
    environment: 'node',
    watch: false,
    testTimeout: 15000,
    pool: 'forks',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['**/*.{js,jsx,ts,tsx}'],
      exclude: ['**/build/**', '**/node_modules/**', '**/__tests__/**', '**/tests/**', '**/__mocks__/**', '**/*.d.ts'],
    },
  },
})
