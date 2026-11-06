import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

/**
 * El front se sirve con Vite en desarrollo (3000) y con `server/index.mjs` en
 * producción. En desarrollo, `/api` se proxya al servidor Node (3001) para que
 * el navegador solo hable con un origen.
 */
const API_TARGET = process.env.API_TARGET || 'http://127.0.0.1:3001';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    // AI Studio desactiva el HMR con DISABLE_HMR para que la edición de
    // archivos no provoque parpadeos durante la grabación.
    hmr: process.env.DISABLE_HMR !== 'true',
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: false },
    },
  },
});
