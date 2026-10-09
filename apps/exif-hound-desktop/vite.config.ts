import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';

const isDev = process.env.TAURI_DEBUG === 'true';

// Get the absolute path to the packages directory
const packagesDir = path.resolve(__dirname, '../../packages');

// App version is sourced from tauri.conf.json — the single authoritative
// version for the release pipeline (CI reads it there too).
const appVersion = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'src-tauri/tauri.conf.json'), 'utf8'),
).version as string;

// In-progress features gated from production builds. Dev/test builds enable
// the whole registry; production builds enable only names listed in the
// EXIFHOUND_FEATURES env var (comma-separated). Register new gated features
// here and guard their UI with isFeatureEnabled() from src/config/featureFlags.
const GATED_FEATURES = ['investigation'];
const requestedFeatures = (process.env.EXIFHOUND_FEATURES ?? '')
  .split(',')
  .map(name => name.trim())
  .filter(Boolean);
const isProductionBuild = process.env.NODE_ENV === 'production';
const featureFlags = isProductionBuild
  ? requestedFeatures.filter(name => GATED_FEATURES.includes(name))
  : [...new Set([...GATED_FEATURES, ...requestedFeatures])];

// Update channel baked into the frontend for display/diagnostics only.
// The actual feed URL is configured in the matching Tauri channel overlay.
const updateChannel = (process.env.EXIFHOUND_UPDATE_CHANNEL ?? 'stable').toLowerCase();
if (updateChannel !== 'stable' && updateChannel !== 'beta' && updateChannel !== 'internal') {
  throw new Error(`Invalid EXIFHOUND_UPDATE_CHANNEL "${updateChannel}" — expected "stable", "beta" or "internal"`);
}
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // __DEV__ replaces import.meta.env.DEV so source files stay Jest-compatible
    // (ts-jest/Jest 30 treat files containing import.meta as ESM).
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    // App version from tauri.conf.json (the authoritative version source)
    __APP_VERSION__: JSON.stringify(appVersion),
    // Feature flags gating in-progress features (see GATED_FEATURES above)
    __FEATURE_FLAGS__: JSON.stringify(featureFlags),
    // Update channel this build listens to ('stable' | 'beta' | 'internal')
    __UPDATE_CHANNEL__: JSON.stringify(updateChannel),
  },
  optimizeDeps: {
    // PaddleOCR ships its worker as a relative sibling asset. Pre-bundling its
    // package rewrites that URL into Vite's temporary deps directory, where the
    // worker file is not copied. Keep the SDK on the normal package path.
    exclude: ['@paddleocr/paddleocr-js'],
    include: [
      '@tauri-apps/api',
      // These SDK dependencies include CommonJS packages that need Vite's
      // interop when the Paddle SDK itself stays unoptimized for its worker URL.
      'clipper-lib',
      'js-yaml',
      '@techstark/opencv-js',
      // This package exposes thousands of icon modules from one ESM entry.
      // Pre-bundle it so the browser doesn't have to resolve them one by one
      // during the first Cypress page load.
      'lucide-react',
      'investigation-archive',
      'sql.js',
    ],
  },
  resolve: {
    alias: [
      { find: 'exif-middleware', replacement: path.join(packagesDir, 'exif-middleware/dist') },
      { find: 'investigation-archive', replacement: path.join(packagesDir, 'investigation-archive/dist') },
      { find: 'exif-insights', replacement: path.join(packagesDir, 'exif-insights/dist') },
      { find: 'image-forensics-middleware', replacement: path.join(packagesDir, 'image-forensics-middleware/dist') },
      { find: 'image-processing-middleware', replacement: path.join(packagesDir, 'image-processing-middleware/dist') },
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
          'vendor-leaflet': ['leaflet', 'react-leaflet', 'react-leaflet-cluster'],
          'vendor-visx': ['@visx/axis', '@visx/group', '@visx/hierarchy', '@visx/scale', '@visx/shape', '@visx/tooltip', '@visx/zoom'],
          'vendor-exif': ['exifreader'],
          // React and core libraries
          'vendor-react': ['react', 'react-dom'],
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
