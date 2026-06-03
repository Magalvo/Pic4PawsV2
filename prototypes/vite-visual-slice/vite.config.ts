import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@pic4paws/domain': new URL('../../packages/domain/src/index.ts', import.meta.url).pathname,
    },
  },
});
