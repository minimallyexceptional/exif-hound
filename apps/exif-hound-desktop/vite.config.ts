import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const isDev = process.env.TAURI_DEBUG === 'true';

// Get the absolute path to the packages directory
const packagesDir = path.resolve(__dirname, '../../packages');

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@tauri-apps/api'
    ],
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: [
      { find: 'shared-utils', replacement: path.join(packagesDir, 'shared-utils/dist') },
      { find: 'exif-middleware', replacement: path.join(packagesDir, 'exif-middleware/dist') }
    ],
  },
  
  // Vite config for Tauri
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: false, // Allow fallback ports
    watch: {
      // Don't trigger reload for these files
      ignored: ['**/node_modules/**', '**/.git/**']
    },
    hmr: {
      // Make HMR available for Tauri even when using a different port
      host: 'localhost',
      protocol: 'ws',
    }
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: ['es2021', 'chrome100', 'safari13'],
    minify: !isDev ? 'esbuild' : false,
    sourcemap: !!isDev,
  }
});
