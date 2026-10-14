export { EvidenceHubService } from './EvidenceHubService';
export { EvidenceRepository } from './EvidenceRepository';
export { EvidenceIndexBuilder } from './EvidenceIndexBuilder';
export { EvidenceCategoryColumnModel } from './EvidenceCategoryColumnModel';
export { loadProjectEvidenceData } from './loadProjectEvidence';
export { buildEvidenceIndex } from './buildEvidenceIndex';
export * from './evidenceTypes';
export * from './evidenceTableFormatters';
export {
  applyGpsPlaceNamePatches,
  resolveMissingGpsPlaceNames,
  type GpsPlaceNamePatch,
} from './resolveGpsPlaceNames';

import { EvidenceHubService } from './EvidenceHubService';
import { EvidenceRepository } from './EvidenceRepository';
import { EvidenceIndexBuilder } from './EvidenceIndexBuilder';
import { EvidenceCategoryColumnModel } from './EvidenceCategoryColumnModel';
import { loadProjectEvidenceData } from './loadProjectEvidence';
import { buildEvidenceIndex } from './buildEvidenceIndex';

export class EvidenceNamespace {
  readonly hub = EvidenceHubService;
  readonly repository = EvidenceRepository;
  readonly indexBuilder = EvidenceIndexBuilder;
  readonly columnModel = EvidenceCategoryColumnModel;
  readonly loadProjectEvidenceData = loadProjectEvidenceData;
  readonly buildEvidenceIndex = buildEvidenceIndex;
}
