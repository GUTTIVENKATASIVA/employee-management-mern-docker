import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development, "npm run dev" proxies /api to the backend, mirroring what
// Nginx does inside Docker. Override the target with VITE_DEV_API_TARGET.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_TARGET || 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
