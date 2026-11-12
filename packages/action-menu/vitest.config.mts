import { defineProject, mergeConfig } from 'vitest/config'

import baseConfig from '../../vitest.config.base'

export default mergeConfig(
  baseConfig,
  defineProject({
    test: {
      name: 'action-menu',
      root: __dirname,
      include: ['tests/**/*.test.ts', 'src/**/__tests__/*.test.ts'],
    },
  })
)
