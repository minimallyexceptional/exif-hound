import type { ExifHoundCore } from 'exif-hound-core';
import type { UpdateService } from 'exif-hound-core';

export class UpdaterController {
  constructor(private readonly core: ExifHoundCore) {}

  getService(): UpdateService {
    return this.core.updater.getUpdateService();
  }
}
