import type { ExifHoundCore } from 'exif-hound-core';
import {
  fromStoreState,
  serializeExif,
  toImageData,
  toStoreImage,
  toStoreState,
} from 'exif-hound-core';

/** Orchestrates project session persistence through core. */
export class AppSessionController {
  constructor(private readonly core: ExifHoundCore) {}

  get dbProvider() {
    return this.core.project.db.getArchiveDbProvider();
  }

  get fsPort() {
    return this.core.project.fs.TauriFsPort;
  }

  get dialogs() {
    return this.core.project.dialogs;
  }

  get recentProjects() {
    return this.core.project.recentProjects;
  }

  mapToImageData = toImageData;
  mapToStoreImage = toStoreImage;
  mapToStoreState = toStoreState;
  mapFromStoreState = fromStoreState;
  serializeExif = serializeExif;

  parseImport(raw: Parameters<ExifHoundCore['importExport']['parseImportData']>[0]) {
    return this.core.importExport.parseImportData(raw);
  }
}
