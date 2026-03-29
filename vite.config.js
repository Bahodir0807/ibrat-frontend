import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules') && !id.includes('/src/mock/')) {
            return undefined;
          }

          if (id.includes('react-router')) {
            return 'router';
          }

          if (id.includes('@tanstack/react-query')) {
            return 'query';
          }

          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
            return 'forms';
          }

          if (id.includes('axios')) {
            return 'network';
          }

          if (id.includes('/src/mock/')) {
            return 'mock';
          }

          if (id.includes('sonner')) {
            return 'toast';
          }

          if (id.includes('react') || id.includes('scheduler')) {
            return 'react-vendor';
          }

          return 'vendor';
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
});
