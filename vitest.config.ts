import { defineConfig } from 'vitest/config'

// Ensure PostCSS is skipped during tests
process.env.VITE_SKIP_POSTCSS = '1'

export default defineConfig({
  test: {
    environment: 'node',
    hookTimeout: 10000,
    setupFiles: [],
  },
})
