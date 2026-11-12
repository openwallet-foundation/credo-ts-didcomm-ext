import { defineProject, mergeConfig } from 'vitest/config'

import baseConfig from '../../vitest.config.base'

export default mergeConfig(
  baseConfig,
  defineProject({
    test: {
      name: 'drpc',
      root: __dirname,
      include: ['tests/**/*.test.ts', 'src/**/__tests__/*.test.ts'],
    },
  })
)
