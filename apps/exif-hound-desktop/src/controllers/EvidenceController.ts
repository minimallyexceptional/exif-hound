import type { ExifHoundCore } from 'exif-hound-core';

export class EvidenceController {
  readonly hub;
  readonly repository;
  readonly columnModel;
  readonly loadProjectEvidenceData;
  readonly buildEvidenceIndex;

  constructor(core: ExifHoundCore) {
    this.hub = core.evidence.hub;
    this.repository = core.evidence.repository;
    this.columnModel = core.evidence.columnModel;
    this.loadProjectEvidenceData = core.evidence.loadProjectEvidenceData;
    this.buildEvidenceIndex = core.evidence.buildEvidenceIndex;
  }
}
