import type { OcrResultRecord, ProjectStore, WorkflowToolResultRecord } from 'investigation-archive';
import { EvidenceRepository } from './EvidenceRepository';

export interface ProjectEvidenceSources {
  ocr: OcrResultRecord[];
  identifiers: WorkflowToolResultRecord[];
  provenance: WorkflowToolResultRecord[];
}

/** Loads all project evidence rows; supports older investigation-archive builds without listProject* APIs. */
export async function loadProjectEvidenceData(store: ProjectStore): Promise<ProjectEvidenceSources> {
  return EvidenceRepository.load(store);
}
