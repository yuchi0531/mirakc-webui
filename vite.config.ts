import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pkg from './package.json';

const MIRAKC_ORIGIN = 'http://localhost:40772';

export default defineConfig({
  plugins: [react()],
  // Relative base so dist/ works under any server.mounts path (e.g. /www).
  base: './',
  define: {
    __WEBUI_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    proxy: {
      '/api': { target: MIRAKC_ORIGIN, changeOrigin: true },
      '/events': { target: MIRAKC_ORIGIN, changeOrigin: true },
    },
  },
});
