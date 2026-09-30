import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      setupFiles: ['fake-indexeddb/auto'],
      include: ['src/**/*.test.ts'],
    },
  }),
)
