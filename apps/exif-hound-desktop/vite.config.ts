import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

const isDev = process.env.TAURI_DEBUG === 'true';

// Get the absolute path to the packages directory
const packagesDir = path.resolve(__dirname, '../../packages');

// App edition: 'pro' (default) or 'community'. Set with EDITION=community.
const edition = (process.env.EDITION ?? 'pro').toLowerCase();
if (edition !== 'pro' && edition !== 'community') {
  throw new Error(`Invalid EDITION "${edition}" — expected "pro" or "community"`);
}
const appName = edition === 'community' ? 'Exif Hound Community' : 'Exif Hound Pro';
// Update channel baked into the frontend for display/diagnostics only. The
// actual feed URL the updater fetches is configured in the Tauri edition
// overlays (src-tauri/tauri.<edition>[.<channel>].conf.json).
const updateChannel = (process.env.EXIFHOUND_UPDATE_CHANNEL ?? 'stable').toLowerCase();
if (updateChannel !== 'stable' && updateChannel !== 'beta' && updateChannel !== 'internal') {
  throw new Error(`Invalid EXIFHOUND_UPDATE_CHANNEL "${updateChannel}" — expected "stable", "beta" or "internal"`);
}
// Exposes the app name for %VITE_APP_NAME% replacement in index.html
process.env.VITE_APP_NAME = appName;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // __DEV__ replaces import.meta.env.DEV so source files stay Jest-compatible
    // (ts-jest/Jest 30 treat files containing import.meta as ESM).
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    // Build-time edition switch: 'pro' | 'community'. In community builds the
    // pro-only Investigation view is tree-shaken out of the bundle.
    __EDITION__: JSON.stringify(edition),
    // User-facing app name, switches with the edition
    __APP_NAME__: JSON.stringify(appName),
    // Update channel this build listens to ('stable' | 'beta' | 'internal')
    __UPDATE_CHANNEL__: JSON.stringify(updateChannel),
  },
  optimizeDeps: {
    include: [
      '@tauri-apps/api',
      'leaflet-fullscreen'
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
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries
          'vendor-leaflet': ['leaflet', 'react-leaflet', 'leaflet.heat', 'leaflet-fullscreen', 'react-leaflet-cluster'],
          'vendor-visx': ['@visx/axis', '@visx/group', '@visx/hierarchy', '@visx/scale', '@visx/shape', '@visx/tooltip', '@visx/zoom'],
          'vendor-exif': ['exifreader'],
          // React and core libraries
          'vendor-react': ['react', 'react-dom'],
          // Date and utility libraries
          'vendor-utils': ['date-fns', 'geolib'],
        },
      },
    },
  },
  // Worker configuration for EXIF processing
  worker: {
    format: 'es',
    plugins: () => [react()],
  },
});
