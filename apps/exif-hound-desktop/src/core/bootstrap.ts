import { createDesktopCore, type ExifHoundCore } from 'exif-hound-core';
import workerUrl from 'exif-hound-core/workers/image-processing?worker&url';
import { getArchiveDbProvider } from './archiveDbProvider';

export function bootstrapCore(): ExifHoundCore {
  return createDesktopCore({
    getArchiveDbProvider,
    imageProcessingWorkerUrl: workerUrl,
  });
}
