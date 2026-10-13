import type { OcrResultRecord, WorkflowToolResultRecord } from 'investigation-archive';
import type { ImageData } from '../../types';
import { buildEvidenceIndex as buildIndex } from './buildEvidenceIndex';
import type { EvidenceIndex } from './evidenceTypes';

/** Builds category counts and row maps from raw project evidence sources. */
export class EvidenceIndexBuilder {
  build(
    ocrResults: OcrResultRecord[],
    identifierResults: WorkflowToolResultRecord[],
    provenanceResults: WorkflowToolResultRecord[],
    images: ImageData[],
  ): EvidenceIndex {
    return buildIndex(ocrResults, identifierResults, provenanceResults, images);
  }
}
