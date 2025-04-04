import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isDev = process.env.TAURI_DEBUG === 'true';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: [
      { find: 'shared-utils', replacement: '../../packages/shared-utils/src' },
      { find: 'exif-middleware', replacement: '../../packages/exif-middleware/src' }
    ],
  },
  
  // Vite config for Tauri
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: false,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: ['es2021', 'chrome100', 'safari13'],
    minify: !isDev ? 'esbuild' : false,
    sourcemap: !!isDev,
  }
});
