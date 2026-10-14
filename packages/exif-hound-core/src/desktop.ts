import type { DatabaseEngineProvider } from 'investigation-archive';
import { ExifHoundCore } from './ExifHoundCore';
import { configureImageProcessingWorker } from './middleware/preprocessImage';
import { registerArchiveDbProviderFactory } from './platform/desktop/archiveDbProvider';

export interface DesktopCoreOptions {
  getArchiveDbProvider: () => Promise<DatabaseEngineProvider>;
  imageProcessingWorkerUrl: string;
}

let singleton: ExifHoundCore | null = null;

export function createDesktopCore(options: DesktopCoreOptions): ExifHoundCore {
  registerArchiveDbProviderFactory(options.getArchiveDbProvider);
  configureImageProcessingWorker(options.imageProcessingWorkerUrl);
  const core = new ExifHoundCore();
  singleton = core;
  return core;
}

export function getCore(): ExifHoundCore {
  if (!singleton) {
    throw new Error('EXIF Hound Core is not initialized. Call createDesktopCore first.');
  }
  return singleton;
}

export function resetCoreForTests(): void {
  singleton = null;
}

export { ExifHoundCore } from './ExifHoundCore';
