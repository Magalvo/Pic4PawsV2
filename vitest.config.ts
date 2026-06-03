import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'packages/**/*.test.ts', 'apps/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@pic4paws/domain': new URL('./packages/domain/src/index.ts', import.meta.url).pathname,
    },
  },
});
