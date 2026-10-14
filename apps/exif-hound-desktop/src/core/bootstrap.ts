import { createDesktopCore, type ExifHoundCore } from 'exif-hound-core';
import workerUrl from '../workers/imageProcessingWorker?worker&url';
import { getArchiveDbProvider } from './archiveDbProvider';

export function bootstrapCore(): ExifHoundCore {
  return createDesktopCore({
    getArchiveDbProvider,
    imageProcessingWorkerUrl: workerUrl,
  });
}
