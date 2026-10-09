import type { OcrResult, OcrWord } from 'ocr-middleware';

export interface ForensicImageInput {
  imageId: number;
  imageName: string;
  bytes: Uint8Array;
  metadata?: Record<string, unknown>;
}

export interface ImageStructureFacts {
  format: 'jpeg' | 'png' | 'webp' | 'unknown';
  width?: number;
  height?: number;
  quantizationTableFingerprints: string[];
  scans?: number;
  frames?: number;
}

export interface MetadataReader {
  read(bytes: Uint8Array): Promise<Record<string, unknown>> | Record<string, unknown>;
}

export interface ImageStructureReader {
  inspect(bytes: Uint8Array): ImageStructureFacts;
}

export interface ProvenanceTimestampFacts {
  capture?: string;
  digitized?: string;
  modified?: string;
}

export interface ProvenanceIndicator {
  code: string;
  severity: 'info' | 'notice';
  message: string;
  sourceField?: string;
  observedValue?: string;
  sourceFields?: string[];
}

export interface ImageProvenanceResult {
  schemaVersion: 1;
  toolVersion: string;
  imageId: number;
  imageName: string;
  facts: ImageStructureFacts & { timestamps: ProvenanceTimestampFacts; metadataFieldCount: number };
  indicators: ProvenanceIndicator[];
}

export type CandidateFamily = 'email' | 'url-domain' | 'phone-like' | 'coordinate-pair' | 'license-plate-like';

export interface IdentifierCandidate {
  family: CandidateFamily;
  value: string;
  confidence: number;
  sourceWords: number[];
  boundingBox: OcrWord['boundingBox'];
  profile?: string;
}

export interface VisualIdentifierSettings {
  language?: string;
  enabledFamilies?: string | CandidateFamily[];
  licensePlateProfile?: string | null;
}

export interface VisualIdentifierInput extends ForensicImageInput {
  settings: VisualIdentifierSettings;
}

export interface VisualIdentifierResult {
  schemaVersion: 1;
  toolVersion: string;
  imageId: number;
  imageName: string;
  text: string;
  confidence: number;
  words: OcrWord[];
  candidates: IdentifierCandidate[];
}

export interface LocalOcrRecognizer {
  recognize(image: Uint8Array, options?: { languages?: string | string[]; onProgress?: (progress: OcrResultProgress) => void }): Promise<OcrResult>;
}

export interface OcrResultProgress { status: string; progress: number }
