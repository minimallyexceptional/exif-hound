import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    desktop: 'src/desktop.ts',
    'workers/exif': 'src/workers/exif.ts',
    'workers/image-processing': 'src/workers/image-processing.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  external: ['leaflet', '@tmcw/togeojson'],
});
