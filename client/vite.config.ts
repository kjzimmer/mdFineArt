import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const BACKEND = 'http://localhost:3010';

export default defineConfig({
  plugins: [react()],
  // Expose backend URL so large uploads can bypass the dev proxy entirely.
  // In production the value is '' so relative URLs are used.
  define: {
    __BACKEND__: JSON.stringify(process.env.NODE_ENV === 'production' ? '' : BACKEND),
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': BACKEND,
      '/uploads': BACKEND,
    },
  },
});
