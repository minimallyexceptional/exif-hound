import type { ExifHoundCore } from 'exif-hound-core';
import type { ExifMetadata } from 'exif-hound-core';

export class ExifViewController {
  constructor(private readonly core: ExifHoundCore) {}

  extractExifData(buffer: ArrayBuffer): Promise<ExifMetadata> {
    return this.core.middleware.exif.extractExifData(buffer);
  }

  loadExifReaderTags(buffer: ArrayBuffer) {
    return this.core.middleware.exif.loadExifReaderTags(buffer);
  }
}
