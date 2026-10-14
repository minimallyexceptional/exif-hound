import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';
import { contentTypeForOcrAsset, resolvePublicOcrPath } from './src/utils/ocrPublicAsset';

const packagesDir = path.resolve(__dirname, '../../packages');

const WORKSPACE_PACKAGE_DIST_DIRS = [
  'exif-hound-core/dist',
  'exif-middleware/dist',
  'image-processing-middleware/dist',
].map((segment) => path.join(packagesDir, segment));

function isReloadableDistOutput(file: string): boolean {
  return /\.(?:[cm]?js)$/.test(file);
}

function distDirForFile(file: string): string | undefined {
  return WORKSPACE_PACKAGE_DIST_DIRS.find((dir) => file === dir || file.startsWith(`${dir}${path.sep}`));
}

/** Full reload when aliased workspace package dist changes (avoids 504 Outdated Optimize Dep). */
function reloadOnWorkspaceDistChange(): Plugin {
  let acceptingEvents = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  return {
    name: 'reload-on-workspace-dist-change',
    configureServer(server) {
      for (const dir of WORKSPACE_PACKAGE_DIST_DIRS) {
        server.watcher.add(dir);
      }

      server.httpServer?.once('listening', () => {
        // Chokidar emits "add" for every existing dist file when the directory is
        // registered — reloading then wipes optimizeDeps and breaks HMR/WebSocket setup.
        setTimeout(() => {
          acceptingEvents = true;
        }, 750);
      });

      const scheduleReload = (file: string) => {
        if (!acceptingEvents || !distDirForFile(file) || !isReloadableDistOutput(file)) return;
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          debounceTimer = null;
          const viteCache = path.join(__dirname, 'node_modules', '.vite');
          fs.rmSync(viteCache, { recursive: true, force: true });
          server.ws.send({ type: 'full-reload' });
        }, 200);
      };

      server.watcher.on('change', scheduleReload);
      server.watcher.on('add', scheduleReload);
    },
  };
}

function servePublicOcrAssets(): Plugin {
  const ocrRoot = path.resolve(__dirname, 'public/ocr');
  return {
    name: 'serve-public-ocr-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const file = resolvePublicOcrPath(req.url ?? '', ocrRoot);
        if (!file) {
          next();
          return;
        }
        res.setHeader('Content-Type', contentTypeForOcrAsset(file));
        fs.createReadStream(file).pipe(res);
      });
    },
  };
}

const isDev = process.env.TAURI_DEBUG === 'true';

// App version is sourced from tauri.conf.json — the single authoritative
// version for the release pipeline (CI reads it there too).
const appVersion = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'src-tauri/tauri.conf.json'), 'utf8'),
).version as string;

// Update channel baked into the frontend for display/diagnostics only.
// The actual feed URL is configured in the matching Tauri channel overlay.
const updateChannel = (process.env.EXIFHOUND_UPDATE_CHANNEL ?? 'stable').toLowerCase();
if (updateChannel !== 'stable' && updateChannel !== 'beta' && updateChannel !== 'internal') {
  throw new Error(`Invalid EXIFHOUND_UPDATE_CHANNEL "${updateChannel}" — expected "stable", "beta" or "internal"`);
}
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reloadOnWorkspaceDistChange(), servePublicOcrAssets(), react(), tailwindcss()],
  define: {
    // __DEV__ replaces import.meta.env.DEV so source files stay Jest-compatible
    // (ts-jest/Jest 30 treat files containing import.meta as ESM).
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    // App version from tauri.conf.json (the authoritative version source)
    __APP_VERSION__: JSON.stringify(appVersion),
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
      // during the first Playwright page load.
      'lucide-react',
      // Core dist externalizes leaflet/sql.js/etc.; must pre-bundle for WebKit (star-export/default).
      // Stale hashes → 504: clear node_modules/.vite on dev start + reload-on-core-dist-change plugin.
      'exif-hound-core',
      'sql.js',
    ],
  },
  resolve: {
    dedupe: ['leaflet'],
    alias: [
      { find: 'exif-hound-core/desktop', replacement: path.join(packagesDir, 'exif-hound-core/dist/desktop.js') },
      { find: 'exif-hound-core', replacement: path.join(packagesDir, 'exif-hound-core/dist/index.js') },
      { find: 'exif-middleware', replacement: path.join(packagesDir, 'exif-middleware/dist') },
      { find: 'image-processing-middleware', replacement: path.join(packagesDir, 'image-processing-middleware/dist') },
    ],
  },
  
  // Vite config for Tauri (must match src-tauri/tauri.conf.json devUrl)
  clearScreen: false,
  server: {
    port: 5176,
    strictPort: true,
    host: '127.0.0.1',
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**', '**/src-tauri/**'],
    },
    hmr: {
      // WebView loads http://127.0.0.1:5176 — HMR must use the same host, not
      // "localhost", or WebSocket may hit a different Vite instance on ::1.
      host: '127.0.0.1',
      port: 5176,
      protocol: 'ws',
    },
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
